import { z } from "zod/v4";
import { normalizeUrl } from "@/lib/url";
import { ruleConditionSchema } from "./routing";

export const shortCodeSchema = z
    .string()
    .min(3, "Short code must be at least 3 characters")
    .max(32, "Short code must be at most 32 characters")
    .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Short code can only contain letters, numbers, hyphens and underscores",
    );

// URL schema with automatic normalization
export const urlSchema = z
    .string()
    .min(1, "URL is required")
    .transform(normalizeUrl)
    .pipe(z.url("Please enter a valid URL"));

export const createLinkSchema = z.object({
    url: urlSchema,
    shortCode: shortCodeSchema.optional(),
    title: z.string().max(200).optional(),
    description: z.string().max(500).optional(),
    comments: z.string().max(1000).optional(),
    password: z.string().min(1).max(100).optional(),
    expiresAt: z.iso.datetime().optional(),
    archived: z.boolean().optional(),

    // UTM
    utmSource: z.string().max(200).optional(),
    utmMedium: z.string().max(200).optional(),
    utmCampaign: z.string().max(200).optional(),
    utmTerm: z.string().max(200).optional(),
    utmContent: z.string().max(200).optional(),

    // OG
    ogTitle: z.string().max(200).optional(),
    ogDescription: z.string().max(500).optional(),
    ogImage: z
        .string()
        .min(1)
        .transform(normalizeUrl)
        .pipe(z.url("Please enter a valid image URL"))
        .optional()
        .or(z.literal("")),

    // Relations
    domainId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),

    // Organization context
    organizationId: z.string(),

    // Routing rules (optional, created alongside the link)
    routingRules: z.array(z.object({
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
    })).optional(),
});

export const updateLinkSchema = createLinkSchema
    .partial()
    .omit({ organizationId: true })
    .extend({
        id: z.string(),
    });

export const deleteLinkSchema = z.object({
    id: z.string(),
});

export const getLinkSchema = z.object({
    id: z.string(),
});

export const listLinksSchema = z.object({
    organizationId: z.string(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    tagId: z.string().optional(),
    archived: z.boolean().optional(),
    sortBy: z.enum(["createdAt", "clicks", "updatedAt", "title", "shortCode"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
export type ListLinksInput = z.infer<typeof listLinksSchema>;
