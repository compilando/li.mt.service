import { z } from "zod/v4";
import { PLAN_ORDER, type PlanId } from "@/lib/plans";

// ─── Plan Schemas ────────────────────────────────────────────────────────────

/**
 * Valid plan IDs
 */
export const planIdSchema = z.enum(PLAN_ORDER as [PlanId, ...PlanId[]]);

/**
 * Change plan input
 */
export const changePlanSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
    planId: planIdSchema,
});

export type ChangePlanInput = z.infer<typeof changePlanSchema>;

/**
 * Get plan guard state input
 */
export const getPlanGuardStateSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
});

export type GetPlanGuardStateInput = z.infer<typeof getPlanGuardStateSchema>;

/**
 * Get organization usage input
 */
export const getOrganizationUsageSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
});

export type GetOrganizationUsageInput = z.infer<typeof getOrganizationUsageSchema>;

/**
 * Check plan limit input
 */
export const checkPlanLimitSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
    resource: z.enum(["links", "tags", "domains", "apiKeys", "members", "clicksPerMonth"]),
    count: z.number().int().positive().default(1),
});

export type CheckPlanLimitInput = z.infer<typeof checkPlanLimitSchema>;
