"use server";

import prisma from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { requireAuth, requireOrgMembership } from "@/lib/auth-guards";

/**
 * Track a click on a link (called from the redirect route)
 */
export async function trackClick(data: {
    linkId: string;
    country?: string;
    city?: string;
    region?: string;
    device?: string;
    browser?: string;
    os?: string;
    referrer?: string;
    ipHash?: string;
    userAgent?: string;
}) {
    await prisma.linkClick.create({
        data: {
            linkId: data.linkId,
            country: data.country,
            city: data.city,
            region: data.region,
            device: data.device,
            browser: data.browser,
            os: data.os,
            referrer: data.referrer,
            ipHash: data.ipHash,
            userAgent: data.userAgent,
        },
    });
}

/**
 * Get analytics for a specific link
 */
export async function getLinkAnalytics(linkId: string, days: number = 30) {
    const session = await requireAuth();

    // Verify that the link belongs to an organization the user is a member of
    const link = await prisma.link.findUnique({
        where: { id: linkId },
        select: { organizationId: true },
    });

    if (!link) {
        throw new NotFoundError("Link");
    }

    await requireOrgMembership(link.organizationId, session.user.id);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totalClicks, clicksByDay, topCountries, topReferrers, topDevices, topBrowsers] =
        await Promise.all([
            // Total clicks
            prisma.linkClick.count({ where: { linkId } }),

            // Clicks by day
            prisma.$queryRaw`
                SELECT DATE("timestamp") as date, COUNT(*)::int as clicks
                FROM "link_click"
                WHERE "linkId" = ${linkId} AND "timestamp" >= ${since}
                GROUP BY DATE("timestamp")
                ORDER BY date ASC
            ` as Promise<Array<{ date: Date; clicks: number }>>,

            // Top countries
            prisma.$queryRaw`
                SELECT "country", COUNT(*)::int as clicks
                FROM "link_click"
                WHERE "linkId" = ${linkId} AND "country" IS NOT NULL AND "timestamp" >= ${since}
                GROUP BY "country"
                ORDER BY clicks DESC
                LIMIT 10
            ` as Promise<Array<{ country: string; clicks: number }>>,

            // Top referrers
            prisma.$queryRaw`
                SELECT "referrer", COUNT(*)::int as clicks
                FROM "link_click"
                WHERE "linkId" = ${linkId} AND "referrer" IS NOT NULL AND "timestamp" >= ${since}
                GROUP BY "referrer"
                ORDER BY clicks DESC
                LIMIT 10
            ` as Promise<Array<{ referrer: string; clicks: number }>>,

            // Top devices
            prisma.$queryRaw`
                SELECT "device", COUNT(*)::int as clicks
                FROM "link_click"
                WHERE "linkId" = ${linkId} AND "device" IS NOT NULL AND "timestamp" >= ${since}
                GROUP BY "device"
                ORDER BY clicks DESC
                LIMIT 5
            ` as Promise<Array<{ device: string; clicks: number }>>,

            // Top browsers
            prisma.$queryRaw`
                SELECT "browser", COUNT(*)::int as clicks
                FROM "link_click"
                WHERE "linkId" = ${linkId} AND "browser" IS NOT NULL AND "timestamp" >= ${since}
                GROUP BY "browser"
                ORDER BY clicks DESC
                LIMIT 5
            ` as Promise<Array<{ browser: string; clicks: number }>>,
        ]);

    return {
        totalClicks,
        clicksByDay,
        topCountries,
        topReferrers,
        topDevices,
        topBrowsers,
    };
}

/**
 * Get overview analytics for an organization
 */
export async function getOrganizationAnalytics(organizationId: string, days: number = 30) {
    const session = await requireAuth();

    // Verify user is a member of the organization
    await requireOrgMembership(organizationId, session.user.id);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totalLinks, totalClicks, clicksByDay] = await Promise.all([
        prisma.link.count({ where: { organizationId } }),

        prisma.linkClick.count({
            where: {
                link: { organizationId },
                timestamp: { gte: since },
            },
        }),

        prisma.$queryRaw`
            SELECT DATE(lc."timestamp") as date, COUNT(*)::int as clicks
            FROM "link_click" lc
            JOIN "link" l ON lc."linkId" = l."id"
            WHERE l."organizationId" = ${organizationId} AND lc."timestamp" >= ${since}
            GROUP BY DATE(lc."timestamp")
            ORDER BY date ASC
        ` as Promise<Array<{ date: Date; clicks: number }>>,
    ]);

    return {
        totalLinks,
        totalClicks,
        clicksByDay,
    };
}
