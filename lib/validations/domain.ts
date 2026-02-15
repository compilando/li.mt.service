import { z } from "zod/v4";
import { normalizeUrl } from "@/lib/url";

// ─── Domain Name Validation ──────────────────────────────────────────────────

const domainNameRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const createDomainSchema = z.object({
    name: z
        .string()
        .min(1, "Domain name is required")
        .regex(domainNameRegex, "Must be a valid domain name")
        .transform((val) => val.toLowerCase().trim()),
    organizationId: z.string(),
    type: z.enum(["custom", "default"]).default("custom"),
    
    // Optional configuration
    notFoundUrl: z
        .string()
        .min(1)
        .transform(normalizeUrl)
        .pipe(z.url("Please enter a valid URL"))
        .optional()
        .or(z.literal("")),
    expiredUrl: z
        .string()
        .min(1)
        .transform(normalizeUrl)
        .pipe(z.url("Please enter a valid URL"))
        .optional()
        .or(z.literal("")),
    placeholder: z.string().max(200).optional(),
    
    // For default domains
    logo: z.string().url().optional(),
    description: z.string().max(500).optional(),
});

export const updateDomainSchema = z.object({
    id: z.string(),
    notFoundUrl: z
        .string()
        .min(1)
        .transform(normalizeUrl)
        .pipe(z.url("Please enter a valid URL"))
        .optional()
        .or(z.literal("")),
    expiredUrl: z
        .string()
        .min(1)
        .transform(normalizeUrl)
        .pipe(z.url("Please enter a valid URL"))
        .optional()
        .or(z.literal("")),
    placeholder: z.string().max(200).optional(),
    logo: z.string().url().optional().or(z.literal("")),
    description: z.string().max(500).optional(),
});

export const deleteDomainSchema = z.object({
    id: z.string(),
});

export const verifyDomainSchema = z.object({
    id: z.string(),
});

export const archiveDomainSchema = z.object({
    id: z.string(),
    archived: z.boolean(),
});

export const listDomainsSchema = z.object({
    organizationId: z.string(),
    type: z.enum(["custom", "default", "all"]).default("all"),
    archived: z.boolean().optional(),
    search: z.string().optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(50),
});

export const checkDomainAvailabilitySchema = z.object({
    name: z
        .string()
        .min(1, "Domain name is required")
        .regex(domainNameRegex, "Must be a valid domain name")
        .transform((val) => val.toLowerCase().trim()),
});

export const getDomainByIdSchema = z.object({
    id: z.string(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type CreateDomainInput = z.infer<typeof createDomainSchema>;
export type UpdateDomainInput = z.infer<typeof updateDomainSchema>;
export type ListDomainsInput = z.infer<typeof listDomainsSchema>;
export type CheckDomainAvailabilityInput = z.infer<typeof checkDomainAvailabilitySchema>;
