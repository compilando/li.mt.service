"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requireAuth, requireOrgMembership } from "@/lib/auth-guards";
import { NotFoundError, ForbiddenError, ConflictError, type ActionResult } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import {
    createDomainSchema,
    updateDomainSchema,
    deleteDomainSchema,
    verifyDomainSchema,
    archiveDomainSchema,
    listDomainsSchema,
    checkDomainAvailabilitySchema,
    getDomainByIdSchema,
    type CreateDomainInput,
    type UpdateDomainInput,
    type ListDomainsInput,
    type CheckDomainAvailabilityInput,
} from "@/lib/validations/domain";
import { createPlanGuard } from "@/lib/actions/plans";
import { verifyDomainDNS, generateVerificationToken, getDnsInstructions } from "@/lib/dns";

// ─── Create Domain ───────────────────────────────────────────────────────────

export async function createDomain(
    input: CreateDomainInput
): Promise<ActionResult<{ id: string; verificationToken?: string }>> {
    try {
        const session = await requireAuth();

        // Validate input
        const validationResult = createDomainSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return {
                success: false,
                error: firstError.message,
                code: "VALIDATION_ERROR",
            };
        }

        const parsed = validationResult.data;
        await requireOrgMembership(parsed.organizationId, session.user.id);

        // Check plan limits (only for custom domains)
        if (parsed.type === "custom") {
            const planGuard = await createPlanGuard(parsed.organizationId);
            if (!planGuard.canCreate("domains")) {
                const upgradePlan = planGuard.getUpgradePlan();
                return {
                    success: false,
                    error: upgradePlan
                        ? `You've reached your domain limit. Upgrade to ${upgradePlan.name} to add more domains.`
                        : "You've reached your domain limit.",
                    code: "PLAN_LIMIT_REACHED",
                };
            }
        }

        // Check if domain already exists
        const existing = await prisma.domain.findUnique({
            where: { name: parsed.name },
        });

        if (existing) {
            return {
                success: false,
                error: "This domain is already registered",
                code: "DOMAIN_ALREADY_EXISTS",
            };
        }

        // Generate verification token for custom domains
        const verificationToken =
            parsed.type === "custom" ? generateVerificationToken() : null;

        // Create domain
        const domain = await prisma.domain.create({
            data: {
                name: parsed.name,
                type: parsed.type,
                organizationId: parsed.organizationId,
                verified: parsed.type === "default", // Default domains are pre-verified
                verificationToken,
                notFoundUrl: parsed.notFoundUrl || null,
                expiredUrl: parsed.expiredUrl || null,
                placeholder: parsed.placeholder || null,
                logo: parsed.logo || null,
                description: parsed.description || null,
            },
        });

        revalidatePath("/app/domains");
        revalidatePath("/app/links");

        return {
            success: true,
            data: {
                id: domain.id,
                verificationToken: verificationToken || undefined,
            },
        };
    } catch (error: unknown) {
        if (error instanceof Error && "code" in error) {
            return {
                success: false,
                error: error.message,
                code: (error as Error & { code: string }).code,
            };
        }
        console.error("Error creating domain:", error);
        return { success: false, error: "Failed to create domain" };
    }
}

// ─── Update Domain ───────────────────────────────────────────────────────────

export async function updateDomain(input: UpdateDomainInput): Promise<ActionResult<{ id: string }>> {
    try {
        const session = await requireAuth();
        const parsed = updateDomainSchema.parse(input);

        // Get domain and verify ownership
        const domain = await prisma.domain.findUnique({
            where: { id: parsed.id },
            include: { organization: true },
        });

        if (!domain) {
            throw new NotFoundError("Domain");
        }

        await requireOrgMembership(domain.organizationId, session.user.id);

        // Update domain
        await prisma.domain.update({
            where: { id: parsed.id },
            data: {
                notFoundUrl: parsed.notFoundUrl || null,
                expiredUrl: parsed.expiredUrl || null,
                placeholder: parsed.placeholder || null,
                logo: parsed.logo || null,
                description: parsed.description || null,
            },
        });

        revalidatePath("/app/domains");
        revalidatePath("/app/links");

        return { success: true, data: { id: parsed.id } };
    } catch (error: unknown) {
        if (error instanceof Error && "code" in error) {
            return {
                success: false,
                error: error.message,
                code: (error as Error & { code: string }).code,
            };
        }
        console.error("Error updating domain:", error);
        return { success: false, error: "Failed to update domain" };
    }
}

// ─── Delete Domain ───────────────────────────────────────────────────────────

export async function deleteDomain(id: string): Promise<ActionResult> {
    try {
        const session = await requireAuth();
        const parsed = deleteDomainSchema.parse({ id });

        // Get domain and verify ownership
        const domain = await prisma.domain.findUnique({
            where: { id: parsed.id },
            include: {
                organization: true,
                _count: { select: { links: true } },
            },
        });

        if (!domain) {
            throw new NotFoundError("Domain");
        }

        await requireOrgMembership(domain.organizationId, session.user.id);

        // Check if domain has links
        if (domain._count.links > 0) {
            return {
                success: false,
                error: `Cannot delete domain with ${domain._count.links} active links. Please reassign or delete the links first.`,
                code: "DOMAIN_HAS_LINKS",
            };
        }

        // Delete domain
        await prisma.domain.delete({ where: { id: parsed.id } });

        revalidatePath("/app/domains");
        revalidatePath("/app/links");

        return { success: true, data: undefined };
    } catch (error: unknown) {
        if (error instanceof Error && "code" in error) {
            return {
                success: false,
                error: error.message,
                code: (error as Error & { code: string }).code,
            };
        }
        console.error("Error deleting domain:", error);
        return { success: false, error: "Failed to delete domain" };
    }
}

// ─── Archive Domain ──────────────────────────────────────────────────────────

export async function archiveDomain(id: string, archived: boolean): Promise<ActionResult> {
    try {
        const session = await requireAuth();
        const parsed = archiveDomainSchema.parse({ id, archived });

        // Get domain and verify ownership
        const domain = await prisma.domain.findUnique({
            where: { id: parsed.id },
            include: { organization: true },
        });

        if (!domain) {
            throw new NotFoundError("Domain");
        }

        await requireOrgMembership(domain.organizationId, session.user.id);

        // Archive/unarchive domain
        await prisma.domain.update({
            where: { id: parsed.id },
            data: { archived: parsed.archived },
        });

        revalidatePath("/app/domains");
        revalidatePath("/app/links");

        return { success: true, data: undefined };
    } catch (error: unknown) {
        if (error instanceof Error && "code" in error) {
            return {
                success: false,
                error: error.message,
                code: (error as Error & { code: string }).code,
            };
        }
        console.error("Error archiving domain:", error);
        return { success: false, error: "Failed to archive domain" };
    }
}

// ─── List Domains ────────────────────────────────────────────────────────────

export async function getDomains(input: ListDomainsInput) {
    try {
        const session = await requireAuth();
        await requireOrgMembership(input.organizationId, session.user.id);

        const page = input.page ?? 1;
        const pageSize = input.pageSize ?? 50;
        const skip = (page - 1) * pageSize;

        const where: Prisma.DomainWhereInput = {
            organizationId: input.organizationId,
        };

        // Filter by type
        if (input.type && input.type !== "all") {
            where.type = input.type;
        }

        // Filter by archived status
        if (input.archived !== undefined) {
            where.archived = input.archived;
        }

        // Search filter
        if (input.search) {
            where.name = {
                contains: input.search,
                mode: "insensitive",
            };
        }

        const [domains, total] = await Promise.all([
            prisma.domain.findMany({
                where,
                include: {
                    _count: { select: { links: true } },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize,
            }),
            prisma.domain.count({ where }),
        ]);

        return {
            domains,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    } catch (error: unknown) {
        console.error("Error getting domains:", error);
        throw error;
    }
}

// ─── Get Domain by ID ────────────────────────────────────────────────────────

export async function getDomainById(id: string) {
    try {
        const session = await requireAuth();
        const parsed = getDomainByIdSchema.parse({ id });

        const domain = await prisma.domain.findUnique({
            where: { id: parsed.id },
            include: {
                organization: true,
                _count: { select: { links: true } },
            },
        });

        if (!domain) {
            throw new NotFoundError("Domain");
        }

        await requireOrgMembership(domain.organizationId, session.user.id);

        return domain;
    } catch (error: unknown) {
        console.error("Error getting domain:", error);
        throw error;
    }
}

// ─── Verify Domain ───────────────────────────────────────────────────────────

export async function verifyDomain(id: string): Promise<ActionResult<{ verified: boolean }>> {
    try {
        const session = await requireAuth();
        const parsed = verifyDomainSchema.parse({ id });

        // Get domain and verify ownership
        const domain = await prisma.domain.findUnique({
            where: { id: parsed.id },
            include: { organization: true },
        });

        if (!domain) {
            throw new NotFoundError("Domain");
        }

        await requireOrgMembership(domain.organizationId, session.user.id);

        // Only custom domains need verification
        if (domain.type !== "custom") {
            return {
                success: false,
                error: "Only custom domains require verification",
                code: "INVALID_DOMAIN_TYPE",
            };
        }

        // Check if already verified
        if (domain.verified) {
            return {
                success: true,
                data: { verified: true },
            };
        }

        // Check if verification token exists
        if (!domain.verificationToken) {
            return {
                success: false,
                error: "Domain has no verification token",
                code: "NO_VERIFICATION_TOKEN",
            };
        }

        // Perform DNS verification
        const result = await verifyDomainDNS(domain.name, domain.verificationToken);

        if (result.verified) {
            // Update domain as verified
            await prisma.domain.update({
                where: { id: parsed.id },
                data: {
                    verified: true,
                    lastCheckedAt: new Date(),
                },
            });

            revalidatePath("/app/domains");
            revalidatePath("/app/links");

            return {
                success: true,
                data: { verified: true },
            };
        } else {
            // Update last checked time even if failed
            await prisma.domain.update({
                where: { id: parsed.id },
                data: { lastCheckedAt: new Date() },
            });

            return {
                success: false,
                error: result.error || "Domain verification failed",
                code: "VERIFICATION_FAILED",
            };
        }
    } catch (error: unknown) {
        if (error instanceof Error && "code" in error) {
            return {
                success: false,
                error: error.message,
                code: (error as Error & { code: string }).code,
            };
        }
        console.error("Error verifying domain:", error);
        return { success: false, error: "Failed to verify domain" };
    }
}

// ─── Check Domain Availability ───────────────────────────────────────────────

export async function checkDomainAvailability(
    input: CheckDomainAvailabilityInput
): Promise<ActionResult<{ available: boolean }>> {
    try {
        await requireAuth();

        const validationResult = checkDomainAvailabilitySchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return {
                success: false,
                error: firstError.message,
                code: "VALIDATION_ERROR",
            };
        }

        const parsed = validationResult.data;

        // Check if domain exists
        const existing = await prisma.domain.findUnique({
            where: { name: parsed.name },
        });

        return {
            success: true,
            data: { available: !existing },
        };
    } catch (error: unknown) {
        if (error instanceof Error && "code" in error) {
            return {
                success: false,
                error: error.message,
                code: (error as Error & { code: string }).code,
            };
        }
        console.error("Error checking domain availability:", error);
        return { success: false, error: "Failed to check domain availability" };
    }
}

// ─── Get DNS Instructions ────────────────────────────────────────────────────

export async function getDomainDnsInstructions(id: string) {
    try {
        const session = await requireAuth();

        const domain = await prisma.domain.findUnique({
            where: { id },
        });

        if (!domain) {
            throw new NotFoundError("Domain");
        }

        await requireOrgMembership(domain.organizationId, session.user.id);

        if (!domain.verificationToken) {
            throw new Error("Domain has no verification token");
        }

        return getDnsInstructions(domain.name, domain.verificationToken);
    } catch (error: unknown) {
        console.error("Error getting DNS instructions:", error);
        throw error;
    }
}
