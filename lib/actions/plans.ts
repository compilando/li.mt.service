"use server";

import prisma from "@/lib/prisma";
import { requireAuth, requireOrgMembership, requireOrgRole } from "@/lib/auth-guards";
import {
    type ActionResult,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    AppError,
} from "@/lib/errors";
import {
    PlanGuard,
    type PlanGuardState,
    type ResourceUsage,
    type PlanId,
    isValidPlanId,
} from "@/lib/plans";
import {
    changePlanSchema,
    getPlanGuardStateSchema,
    getOrganizationUsageSchema,
    checkPlanLimitSchema,
    type ChangePlanInput,
    type GetPlanGuardStateInput,
    type GetOrganizationUsageInput,
    type CheckPlanLimitInput,
} from "@/lib/validations/plan";
import { revalidatePath } from "next/cache";
import { generateId } from "better-auth";

// ─── Usage Calculation ───────────────────────────────────────────────────────

/**
 * Get current resource usage for an organization
 */
export async function getOrganizationUsage(
    input: GetOrganizationUsageInput
): Promise<ActionResult<ResourceUsage>> {
    try {
        const session = await requireAuth();

        const validationResult = getOrganizationUsageSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, error: firstError || "Validation failed" };
        }

        const parsed = validationResult.data;

        // Check if user is a member
        await requireOrgMembership(parsed.organizationId, session.user.id);

        // Calculate usage
        const usage = await calculateOrganizationUsage(parsed.organizationId);

        return { success: true, data: usage };
    } catch (error) {
        if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error getting organization usage:", error);
        return { success: false, error: "Failed to get organization usage" };
    }
}

/**
 * Calculate resource usage for an organization (internal helper)
 */
async function calculateOrganizationUsage(organizationId: string): Promise<ResourceUsage> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel
    const [linksThisMonth, totalTags, totalDomains, totalApiKeys, totalMembers, clicksThisMonth] =
        await Promise.all([
            // Links created this month
            prisma.link.count({
                where: {
                    organizationId,
                    createdAt: { gte: startOfMonth },
                },
            }),
            // Total tags
            prisma.tag.count({
                where: { organizationId },
            }),
            // Total custom domains
            prisma.domain.count({
                where: { organizationId },
            }),
            // Total API keys
            prisma.apiKey.count({
                where: { organizationId },
            }),
            // Total members
            prisma.member.count({
                where: { organizationId },
            }),
            // Clicks this month
            prisma.linkClick.count({
                where: {
                    link: { organizationId },
                    timestamp: { gte: startOfMonth },
                },
            }),
        ]);

    return {
        links: linksThisMonth,
        tags: totalTags,
        domains: totalDomains,
        apiKeys: totalApiKeys,
        members: totalMembers,
        clicksPerMonth: clicksThisMonth,
    };
}

// ─── Plan Guard State ────────────────────────────────────────────────────────

/**
 * Get PlanGuard state for an organization (serialized for client use)
 */
export async function getPlanGuardState(
    input: GetPlanGuardStateInput
): Promise<ActionResult<PlanGuardState>> {
    try {
        const session = await requireAuth();

        const validationResult = getPlanGuardStateSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, error: firstError || "Validation failed" };
        }

        const parsed = validationResult.data;

        // Check if user is a member
        await requireOrgMembership(parsed.organizationId, session.user.id);

        // Get organization
        const organization = await prisma.organization.findUnique({
            where: { id: parsed.organizationId },
            select: { plan: true },
        });

        if (!organization) {
            throw new NotFoundError("Organization");
        }

        // Validate plan ID
        const planId = organization.plan as PlanId;
        if (!isValidPlanId(planId)) {
            console.error(`Invalid plan ID in database: ${planId}`);
            // Fallback to free plan if invalid
            return {
                success: true,
                data: new PlanGuard("free", await calculateOrganizationUsage(parsed.organizationId)).toJSON(),
            };
        }

        // Calculate usage
        const usage = await calculateOrganizationUsage(parsed.organizationId);

        // Create PlanGuard and return state
        const guard = new PlanGuard(planId, usage);

        return { success: true, data: guard.toJSON() };
    } catch (error) {
        if (
            error instanceof UnauthorizedError ||
            error instanceof ForbiddenError ||
            error instanceof NotFoundError
        ) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error getting plan guard state:", error);
        return { success: false, error: "Failed to get plan guard state" };
    }
}

// ─── Plan Limit Checking ─────────────────────────────────────────────────────

/**
 * Check if organization can create more of a resource
 * Returns true if within limits, false if limit reached
 */
export async function checkPlanLimit(
    input: CheckPlanLimitInput
): Promise<ActionResult<{ canCreate: boolean; remaining: number; limit: number }>> {
    try {
        const session = await requireAuth();

        const validationResult = checkPlanLimitSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, error: firstError || "Validation failed" };
        }

        const parsed = validationResult.data;

        // Check if user is a member
        await requireOrgMembership(parsed.organizationId, session.user.id);

        // Get organization plan
        const organization = await prisma.organization.findUnique({
            where: { id: parsed.organizationId },
            select: { plan: true },
        });

        if (!organization) {
            throw new NotFoundError("Organization");
        }

        const planId = organization.plan as PlanId;
        if (!isValidPlanId(planId)) {
            // Fallback to free plan
            const usage = await calculateOrganizationUsage(parsed.organizationId);
            const guard = new PlanGuard("free", usage);
            const canCreate = guard.canCreate(parsed.resource, parsed.count);
            return {
                success: true,
                data: {
                    canCreate,
                    remaining: guard.getRemaining(parsed.resource),
                    limit: guard.getLimit(parsed.resource),
                },
            };
        }

        // Calculate usage and check limit
        const usage = await calculateOrganizationUsage(parsed.organizationId);
        const guard = new PlanGuard(planId, usage);
        const canCreate = guard.canCreate(parsed.resource, parsed.count);

        return {
            success: true,
            data: {
                canCreate,
                remaining: guard.getRemaining(parsed.resource),
                limit: guard.getLimit(parsed.resource),
            },
        };
    } catch (error) {
        if (
            error instanceof UnauthorizedError ||
            error instanceof ForbiddenError ||
            error instanceof NotFoundError
        ) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error checking plan limit:", error);
        return { success: false, error: "Failed to check plan limit" };
    }
}

// ─── Plan Management ─────────────────────────────────────────────────────────

/**
 * Change organization plan
 * Note: In production, this should be triggered by Stripe webhooks
 */
export async function changePlan(input: ChangePlanInput): Promise<ActionResult<void>> {
    try {
        const session = await requireAuth();

        const validationResult = changePlanSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, error: firstError || "Validation failed" };
        }

        const parsed = validationResult.data;

        // Only owners can change plan
        await requireOrgRole(parsed.organizationId, session.user.id, ["owner"]);

        // Get or create subscription
        const existingSubscription = await prisma.subscription.findUnique({
            where: { organizationId: parsed.organizationId },
        });

        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        if (existingSubscription) {
            // Update existing subscription
            await prisma.subscription.update({
                where: { organizationId: parsed.organizationId },
                data: {
                    plan: parsed.planId,
                    status: "active",
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                    cancelAtPeriodEnd: false,
                },
            });
        } else {
            // Create new subscription
            await prisma.subscription.create({
                data: {
                    id: generateId(),
                    organizationId: parsed.organizationId,
                    plan: parsed.planId,
                    status: "active",
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                    cancelAtPeriodEnd: false,
                },
            });
        }

        // Update organization plan field
        await prisma.organization.update({
            where: { id: parsed.organizationId },
            data: { plan: parsed.planId },
        });

        revalidatePath("/app/settings");
        revalidatePath("/app");

        return { success: true, data: undefined };
    } catch (error) {
        if (
            error instanceof UnauthorizedError ||
            error instanceof ForbiddenError ||
            error instanceof NotFoundError
        ) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error changing plan:", error);
        return { success: false, error: "Failed to change plan" };
    }
}

// ─── Helper for Actions ──────────────────────────────────────────────────────

/**
 * Create a PlanGuard for an organization (for use in other server actions)
 */
export async function createPlanGuard(organizationId: string): Promise<PlanGuard> {
    const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { plan: true },
    });

    if (!organization) {
        throw new NotFoundError("Organization");
    }

    const planId = organization.plan as PlanId;
    const validPlanId = isValidPlanId(planId) ? planId : "free";
    const usage = await calculateOrganizationUsage(organizationId);

    return new PlanGuard(validPlanId, usage);
}
