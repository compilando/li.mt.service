"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { generateShortCode, isReservedShortCode } from "@/lib/short-code";
import {
    createLinkSchema,
    updateLinkSchema,
    type CreateLinkInput,
    type UpdateLinkInput,
    type ListLinksInput,
} from "@/lib/validations/link";
import {
    NotFoundError,
    type ActionResult,
} from "@/lib/errors";
import { requireAuth, requireOrgMembership, requireLinkOwnership } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { passwordVerifyRateLimit } from "@/lib/rate-limit";

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createLink(input: CreateLinkInput): Promise<ActionResult<{ id: string; shortCode: string }>> {
    try {
        const session = await requireAuth();

        // Parse and validate input with detailed error messages
        const validationResult = createLinkSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return {
                success: false,
                error: firstError.message,
                code: "VALIDATION_ERROR"
            };
        }

        const parsed = validationResult.data;
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

        const { tagIds, password, ...linkData } = parsed;

        // Hash password if provided
        const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

        const link = await prisma.link.create({
            data: {
                ...linkData,
                shortCode,
                password: hashedPassword,
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
    } catch (error: unknown) {
        if (error instanceof Error && 'code' in error) {
            return { success: false, error: error.message, code: (error as Error & { code: string }).code };
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
    } catch (error: unknown) {
        if (error instanceof Error && 'code' in error) {
            return { success: false, error: error.message, code: (error as Error & { code: string }).code };
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
    } catch (error: unknown) {
        if (error instanceof Error && 'code' in error) {
            return { success: false, error: error.message, code: (error as Error & { code: string }).code };
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
    } catch (error: unknown) {
        if (error instanceof Error && 'code' in error) {
            return { success: false, error: error.message, code: (error as Error & { code: string }).code };
        }
        return { success: false, error: "Failed to archive link" };
    }
}

export async function getLinks(input: ListLinksInput) {
    try {
        const session = await requireAuth();
        await requireOrgMembership(input.organizationId, session.user.id);

        const page = input.page ?? 1;
        const pageSize = input.pageSize ?? 20;
        const skip = (page - 1) * pageSize;

        const where: Prisma.LinkWhereInput = {
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

        const orderBy: Prisma.LinkOrderByWithRelationInput =
            input.sortBy === "clicks"
                ? { clicks: { _count: input.sortOrder ?? "desc" } }
                : { [input.sortBy ?? "createdAt"]: input.sortOrder ?? "desc" };

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
    } catch (error: unknown) {
        console.error("Error getting links:", error);
        throw error; // Re-throw to maintain compatibility with existing code
    }
}

export async function getLinkById(id: string) {
    try {
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
    } catch (error: unknown) {
        console.error("Error getting link by ID:", error);
        throw error; // Re-throw to maintain compatibility with existing code
    }
}

export async function verifyLinkPassword(
    shortCode: string,
    password: string
): Promise<ActionResult<{ url: string }>> {
    try {
        // Rate limiting to prevent brute force attacks
        if (passwordVerifyRateLimit) {
            const { success } = await passwordVerifyRateLimit.limit(shortCode);
            if (!success) {
                return {
                    success: false,
                    error: "Too many password attempts. Please try again later.",
                };
            }
        }

        const link = await prisma.link.findUnique({
            where: { shortCode },
            select: {
                id: true,
                url: true,
                password: true,
                archived: true,
                expiresAt: true,
                utmSource: true,
                utmMedium: true,
                utmCampaign: true,
                utmTerm: true,
                utmContent: true,
            },
        });

        if (!link) {
            return { success: false, error: "Link not found" };
        }

        if (link.archived) {
            return { success: false, error: "This link has been archived" };
        }

        if (link.expiresAt && new Date() > link.expiresAt) {
            return { success: false, error: "This link has expired" };
        }

        if (!link.password) {
            return { success: false, error: "This link is not password protected" };
        }

        const isValid = await bcrypt.compare(password, link.password);
        if (!isValid) {
            return { success: false, error: "Incorrect password" };
        }

        // Build destination URL with UTM params
        const destinationUrl = new URL(link.url);
        if (link.utmSource) destinationUrl.searchParams.set("utm_source", link.utmSource);
        if (link.utmMedium) destinationUrl.searchParams.set("utm_medium", link.utmMedium);
        if (link.utmCampaign) destinationUrl.searchParams.set("utm_campaign", link.utmCampaign);
        if (link.utmTerm) destinationUrl.searchParams.set("utm_term", link.utmTerm);
        if (link.utmContent) destinationUrl.searchParams.set("utm_content", link.utmContent);

        return { success: true, data: { url: destinationUrl.toString() } };
    } catch (error: unknown) {
        console.error("Error verifying password:", error);
        return { success: false, error: "Failed to verify password" };
    }
}
