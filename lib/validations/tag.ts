import { z } from "zod/v4";

export const createTagSchema = z.object({
    name: z
        .string()
        .min(1, "Tag name is required")
        .max(50, "Tag name must be at most 50 characters"),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
        .default("#6B7280"),
    organizationId: z.string(),
});

export const deleteTagSchema = z.object({
    id: z.string(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
