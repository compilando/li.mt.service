import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { trackClick } from "@/lib/actions/analytics";
import crypto from "crypto";
import { evaluateRoutingRules, buildRequestContext } from "@/lib/routing-engine";
import { redirectRateLimit } from "@/lib/rate-limit";

/**
 * Short link redirector with smart routing
 * GET /r/:shortCode → evaluates routing rules and redirects to the appropriate URL
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ shortCode: string }> },
) {
    const { shortCode } = await params;

    // Rate limiting - prevent abuse
    if (redirectRateLimit) {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            "unknown";
        const { success } = await redirectRateLimit.limit(ip);

        if (!success) {
            console.warn(`[Rate Limit] Too many requests from IP: ${ip}`);
            return new NextResponse("Too many requests. Please try again later.", {
                status: 429,
                headers: {
                    "Retry-After": "60",
                },
            });
        }
    }

    const link = await prisma.link.findUnique({
        where: { shortCode },
        select: {
            id: true,
            url: true,
            password: true,
            expiresAt: true,
            archived: true,
            utmSource: true,
            utmMedium: true,
            utmCampaign: true,
            utmTerm: true,
            utmContent: true,
            routingRules: {
                where: { enabled: true },
                include: { conditions: true },
                orderBy: { priority: "asc" },
            },
        },
    });

    // Link not found
    if (!link) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Archived
    if (link.archived) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Expired
    if (link.expiresAt && new Date() > link.expiresAt) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Password protected — redirect to a password page
    if (link.password) {
        return NextResponse.redirect(new URL(`/r/${shortCode}/verify`, request.url));
    }

    // ─── Smart Routing: Evaluate routing rules ──────────────────────────────

    let finalDestinationUrl = link.url;

    if (link.routingRules.length > 0) {
        // Build request context for rule evaluation
        const userAgent = request.headers.get("user-agent") || "";
        const headers: Record<string, string | undefined> = {};
        request.headers.forEach((value, key) => {
            headers[key] = value;
        });

        const url = new URL(request.url);
        const query: Record<string, string> = {};
        url.searchParams.forEach((value, key) => {
            query[key] = value;
        });

        const context = buildRequestContext(userAgent, headers, query);

        // Evaluate routing rules
        const result = evaluateRoutingRules(link.routingRules, context);

        if (result.matched && result.destinationUrl) {
            finalDestinationUrl = result.destinationUrl;
        }
    }

    // Validate URL before redirecting to prevent open redirect attacks
    try {
        const url = new URL(finalDestinationUrl);
        const allowedProtocols = ['http:', 'https:'];

        if (!allowedProtocols.includes(url.protocol)) {
            console.error(`[Security] Blocked redirect to invalid protocol: ${url.protocol} for link ${shortCode}`);
            return NextResponse.redirect(new URL("/", request.url));
        }

        // Build destination URL with UTM params
        if (link.utmSource) url.searchParams.set("utm_source", link.utmSource);
        if (link.utmMedium) url.searchParams.set("utm_medium", link.utmMedium);
        if (link.utmCampaign) url.searchParams.set("utm_campaign", link.utmCampaign);
        if (link.utmTerm) url.searchParams.set("utm_term", link.utmTerm);
        if (link.utmContent) url.searchParams.set("utm_content", link.utmContent);

        // Track click (fire and forget)
        trackClickAsync(request, link.id);

        return NextResponse.redirect(url.toString());
    } catch (error) {
        console.error(`[Security] Invalid redirect URL: ${finalDestinationUrl} for link ${shortCode}`);
        return NextResponse.redirect(new URL("/", request.url));
    }
}

/**
 * Track click asynchronously (fire and forget)
 */
function trackClickAsync(request: NextRequest, linkId: string) {
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || undefined;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // Hash IP for privacy
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);

    // Basic device/browser/os detection from user agent
    const device = /Mobile|Android/i.test(userAgent) ? "mobile" : "desktop";
    const browser = detectBrowser(userAgent);
    const os = detectOS(userAgent);

    trackClick({
        linkId,
        device: detectDevice(userAgent),
        browser,
        os,
        referrer,
        ipHash,
        userAgent: userAgent.slice(0, 500),
    }).catch((err) => console.error("Failed to track click:", err));
}

function detectBrowser(ua: string): string {
    if (/Firefox/i.test(ua)) return "Firefox";
    if (/Edg/i.test(ua)) return "Edge";
    if (/OPR|Opera/i.test(ua)) return "Opera";
    if (/Chrome/i.test(ua)) return "Chrome";
    if (/Safari/i.test(ua)) return "Safari";
    return "Other";
}

function detectOS(ua: string): string {
    if (/Windows/i.test(ua)) return "Windows";
    if (/Mac OS/i.test(ua)) return "macOS";
    if (/Linux/i.test(ua)) return "Linux";
    if (/Android/i.test(ua)) return "Android";
    if (/iOS|iPhone|iPad/i.test(ua)) return "iOS";
    return "Other";
}

function detectDevice(ua: string): string {
    if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return "mobile";
    if (/Tablet|iPad/i.test(ua)) return "tablet";
    return "desktop";
}
