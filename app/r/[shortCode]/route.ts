import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { trackClick } from "@/lib/actions/analytics";
import crypto from "crypto";

/**
 * Short link redirector
 * GET /r/:shortCode → redirects to the original URL
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ shortCode: string }> },
) {
    const { shortCode } = await params;

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
            iosTarget: true,
            androidTarget: true,
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

    // Build destination URL with UTM params
    const destinationUrl = new URL(link.url);
    if (link.utmSource) destinationUrl.searchParams.set("utm_source", link.utmSource);
    if (link.utmMedium) destinationUrl.searchParams.set("utm_medium", link.utmMedium);
    if (link.utmCampaign) destinationUrl.searchParams.set("utm_campaign", link.utmCampaign);
    if (link.utmTerm) destinationUrl.searchParams.set("utm_term", link.utmTerm);
    if (link.utmContent) destinationUrl.searchParams.set("utm_content", link.utmContent);

    // Mobile deep links
    const userAgent = request.headers.get("user-agent") || "";
    if (link.iosTarget && /iPhone|iPad|iPod/i.test(userAgent)) {
        // Track and redirect to iOS target
        trackClickAsync(request, link.id);
        return NextResponse.redirect(link.iosTarget);
    }
    if (link.androidTarget && /Android/i.test(userAgent)) {
        trackClickAsync(request, link.id);
        return NextResponse.redirect(link.androidTarget);
    }

    // Track click (fire and forget)
    trackClickAsync(request, link.id);

    return NextResponse.redirect(destinationUrl.toString());
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
        device,
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
