import { z } from "zod/v4";

export const createDomainSchema = z.object({
    name: z
        .string()
        .min(1, "Domain name is required")
        .regex(
            /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
            "Must be a valid domain name",
        ),
    organizationId: z.string(),
});

export const deleteDomainSchema = z.object({
    id: z.string(),
});

export type CreateDomainInput = z.infer<typeof createDomainSchema>;
