import { z } from "zod/v4";
import { normalizeUrl } from "@/lib/url";

// ─── Operators ───────────────────────────────────────────────────────────────

export const conditionOperators = [
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "in",
    "not_in",
    "gt",
    "gte",
    "lt",
    "lte",
    "between",
] as const;

export type ConditionOperator = (typeof conditionOperators)[number];

// ─── Variables ───────────────────────────────────────────────────────────────

export const conditionVariables = [
    // Device
    "device.type",
    "device.os",
    "device.browser",
    // Geo
    "geo.country",
    "geo.region",
    "geo.city",
    // Time
    "time.hour",
    "time.day",
    "time.month",
    // HTTP
    "http.language",
    "http.referrer",
    // Random (for A/B)
    "random.percent",
] as const;

export type ConditionVariable = (typeof conditionVariables)[number];

// ─── Categories ──────────────────────────────────────────────────────────────

export const aliasCategories = [
    "os",
    "device",
    "browser",
    "country",
    "time",
    "language",
    "custom",
] as const;

export type AliasCategory = (typeof aliasCategories)[number];

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const ruleConditionSchema = z.object({
    id: z.string().optional(),
    variable: z.string().min(1),
    operator: z.enum(conditionOperators),
    value: z.string().min(1),
});

export const createRoutingRuleSchema = z.object({
    linkId: z.string(),
    name: z.string().min(1).max(200),
    destinationUrl: z
        .string()
        .min(1, "Destination URL is required")
        .transform(normalizeUrl)
        .pipe(z.url("Please enter a valid destination URL")),
    priority: z.number().int().min(0).default(0),
    weight: z.number().int().min(1).max(100).optional(),
    enabled: z.boolean().default(true),
    conditions: z.array(ruleConditionSchema).min(1, "At least one condition is required"),
});

export const updateRoutingRuleSchema = createRoutingRuleSchema
    .partial()
    .omit({ linkId: true })
    .extend({
        id: z.string(),
    });

export const deleteRoutingRuleSchema = z.object({
    id: z.string(),
});

export const reorderRoutingRulesSchema = z.object({
    linkId: z.string(),
    ruleIds: z.array(z.string()),
});

export const createConditionAliasSchema = z.object({
    organizationId: z.string().optional(),
    name: z.string().min(1).max(100),
    category: z.enum(aliasCategories),
    variable: z.string().min(1),
    operator: z.enum(conditionOperators),
    value: z.string().min(1),
    icon: z.string().max(10).optional(),
    isSystem: z.boolean().default(false),
});

export const updateConditionAliasSchema = createConditionAliasSchema
    .partial()
    .extend({
        id: z.string(),
    });

export const deleteConditionAliasSchema = z.object({
    id: z.string(),
});

export const getAliasesSchema = z.object({
    organizationId: z.string().optional(),
    category: z.enum(aliasCategories).optional(),
    includeSystem: z.boolean().default(true),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type RuleConditionInput = z.infer<typeof ruleConditionSchema>;
export type CreateRoutingRuleInput = z.infer<typeof createRoutingRuleSchema>;
export type UpdateRoutingRuleInput = z.infer<typeof updateRoutingRuleSchema>;
export type ReorderRoutingRulesInput = z.infer<typeof reorderRoutingRulesSchema>;
export type CreateConditionAliasInput = z.infer<typeof createConditionAliasSchema>;
export type UpdateConditionAliasInput = z.infer<typeof updateConditionAliasSchema>;
export type GetAliasesInput = z.infer<typeof getAliasesSchema>;
