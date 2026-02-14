"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/user";
import { generateShortCode, isReservedShortCode } from "@/lib/short-code";
import {
    createLinkSchema,
    updateLinkSchema,
    type CreateLinkInput,
    type UpdateLinkInput,
    type ListLinksInput,
} from "@/lib/validations/link";
import {
    UnauthorizedError,
    ConflictError,
    NotFoundError,
    ForbiddenError,
    type ActionResult,
} from "@/lib/errors";
import { revalidatePath } from "next/cache";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireAuth() {
    const session = await getSession();
    if (!session?.user) {
        throw new UnauthorizedError();
    }
    return session;
}

async function requireOrgMembership(organizationId: string, userId: string) {
    const member = await prisma.member.findFirst({
        where: { organizationId, userId },
    });
    if (!member) {
        throw new ForbiddenError("You are not a member of this organization");
    }
    return member;
}

async function requireLinkOwnership(linkId: string, userId: string) {
    const link = await prisma.link.findUnique({
        where: { id: linkId },
        include: { organization: { include: { members: true } } },
    });
    if (!link) {
        throw new NotFoundError("Link");
    }
    const isMember = link.organization.members.some((m) => m.userId === userId);
    if (!isMember) {
        throw new ForbiddenError();
    }
    return link;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createLink(input: CreateLinkInput): Promise<ActionResult<{ id: string; shortCode: string }>> {
    try {
        const session = await requireAuth();
        const parsed = createLinkSchema.parse(input);
        await requireOrgMembership(parsed.organizationId, session.user.id);

        // Generate or validate short code
        let shortCode = parsed.shortCode || generateShortCode();

        if (parsed.shortCode) {
            if (isReservedShortCode(parsed.shortCode)) {
                return { success: false, error: "This short code is reserved", code: "RESERVED" };
            }
            const existing = await prisma.link.findUnique({ where: { shortCode: parsed.shortCode } });
            if (existing) {
                return { success: false, error: "This short code is already taken", code: "CONFLICT" };
            }
        } else {
            // Ensure generated code is unique
            let attempts = 0;
            while (attempts < 5) {
                const existing = await prisma.link.findUnique({ where: { shortCode } });
                if (!existing) break;
                shortCode = generateShortCode();
                attempts++;
            }
        }

        const { tagIds, ...linkData } = parsed;

        const link = await prisma.link.create({
            data: {
                ...linkData,
                shortCode,
                expiresAt: linkData.expiresAt ? new Date(linkData.expiresAt) : null,
                tags: tagIds?.length
                    ? {
                        create: tagIds.map((tagId) => ({
                            tagId,
                        })),
                    }
                    : undefined,
            },
        });

        revalidatePath("/app/links");
        return { success: true, data: { id: link.id, shortCode: link.shortCode } };
    } catch (error: any) {
        if (error.code) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error creating link:", error);
        return { success: false, error: "Failed to create link" };
    }
}

export async function updateLink(input: UpdateLinkInput): Promise<ActionResult<{ id: string }>> {
    try {
        const session = await requireAuth();
        const parsed = updateLinkSchema.parse(input);
        await requireLinkOwnership(parsed.id, session.user.id);

        if (parsed.shortCode) {
            if (isReservedShortCode(parsed.shortCode)) {
                return { success: false, error: "This short code is reserved", code: "RESERVED" };
            }
            const existing = await prisma.link.findFirst({
                where: { shortCode: parsed.shortCode, NOT: { id: parsed.id } },
            });
            if (existing) {
                return { success: false, error: "This short code is already taken", code: "CONFLICT" };
            }
        }

        const { id, tagIds, ...data } = parsed;

        await prisma.link.update({
            where: { id },
            data: {
                ...data,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
                tags: tagIds
                    ? {
                        deleteMany: {},
                        create: tagIds.map((tagId) => ({ tagId })),
                    }
                    : undefined,
            },
        });

        revalidatePath("/app/links");
        return { success: true, data: { id } };
    } catch (error: any) {
        if (error.code) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error updating link:", error);
        return { success: false, error: "Failed to update link" };
    }
}

export async function deleteLink(id: string): Promise<ActionResult> {
    try {
        const session = await requireAuth();
        await requireLinkOwnership(id, session.user.id);

        await prisma.link.delete({ where: { id } });

        revalidatePath("/app/links");
        return { success: true, data: undefined };
    } catch (error: any) {
        if (error.code) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error deleting link:", error);
        return { success: false, error: "Failed to delete link" };
    }
}

export async function archiveLink(id: string, archived: boolean): Promise<ActionResult> {
    try {
        const session = await requireAuth();
        await requireLinkOwnership(id, session.user.id);

        await prisma.link.update({ where: { id }, data: { archived } });

        revalidatePath("/app/links");
        return { success: true, data: undefined };
    } catch (error: any) {
        if (error.code) {
            return { success: false, error: error.message, code: error.code };
        }
        return { success: false, error: "Failed to archive link" };
    }
}

export async function getLinks(input: ListLinksInput) {
    const session = await requireAuth();
    await requireOrgMembership(input.organizationId, session.user.id);

    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
        organizationId: input.organizationId,
    };

    if (input.search) {
        where.OR = [
            { url: { contains: input.search, mode: "insensitive" } },
            { title: { contains: input.search, mode: "insensitive" } },
            { shortCode: { contains: input.search, mode: "insensitive" } },
        ];
    }

    if (input.tagId) {
        where.tags = { some: { tagId: input.tagId } };
    }

    if (input.archived !== undefined) {
        where.archived = input.archived;
    }

    const orderBy: any = {};
    if (input.sortBy === "clicks") {
        orderBy.clicks = { _count: input.sortOrder ?? "desc" };
    } else {
        orderBy[input.sortBy ?? "createdAt"] = input.sortOrder ?? "desc";
    }

    const [links, total] = await Promise.all([
        prisma.link.findMany({
            where,
            include: {
                tags: { include: { tag: true } },
                _count: { select: { clicks: true } },
                domain: true,
            },
            orderBy,
            skip,
            take: pageSize,
        }),
        prisma.link.count({ where }),
    ]);

    return {
        links,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
    };
}

export async function getLinkById(id: string) {
    const session = await requireAuth();
    const link = await prisma.link.findUnique({
        where: { id },
        include: {
            tags: { include: { tag: true } },
            _count: { select: { clicks: true } },
            domain: true,
            organization: true,
        },
    });

    if (!link) {
        throw new NotFoundError("Link");
    }

    await requireOrgMembership(link.organizationId, session.user.id);
    return link;
}
