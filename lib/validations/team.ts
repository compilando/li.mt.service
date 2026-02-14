import { z } from "zod/v4";

// ─── Organization/Team Validations ───────────────────────────────────────────

export const createOrganizationSchema = z.object({
    name: z
        .string()
        .min(3, "Organization name must be at least 3 characters")
        .max(50, "Organization name must not exceed 50 characters")
        .trim(),
    slug: z
        .string()
        .min(3, "Slug must be at least 3 characters")
        .max(50, "Slug must not exceed 50 characters")
        .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
        .optional(),
});

export const updateOrganizationSchema = z.object({
    id: z.string().min(1, "Organization ID is required"),
    name: z
        .string()
        .min(3, "Organization name must be at least 3 characters")
        .max(50, "Organization name must not exceed 50 characters")
        .trim()
        .optional(),
    slug: z
        .string()
        .min(3, "Slug must be at least 3 characters")
        .max(50, "Slug must not exceed 50 characters")
        .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
        .optional(),
    logo: z.string().url("Logo must be a valid URL").optional().nullable(),
});

export const deleteOrganizationSchema = z.object({
    id: z.string().min(1, "Organization ID is required"),
});

// ─── Member Management Validations ───────────────────────────────────────────

export const memberRoleEnum = z.enum(["owner", "admin", "member"]);

export const inviteMemberSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
    email: z.string().email("Invalid email address"),
    role: memberRoleEnum.default("member"),
});

export const updateMemberRoleSchema = z.object({
    memberId: z.string().min(1, "Member ID is required"),
    role: memberRoleEnum,
});

export const removeMemberSchema = z.object({
    memberId: z.string().min(1, "Member ID is required"),
});

export const listMembersSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
});

// ─── Invitation Management Validations ───────────────────────────────────────

export const listInvitationsSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
});

export const cancelInvitationSchema = z.object({
    invitationId: z.string().min(1, "Invitation ID is required"),
});

export const acceptInvitationSchema = z.object({
    invitationId: z.string().min(1, "Invitation ID is required"),
});

export const leaveOrganizationSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type DeleteOrganizationInput = z.infer<typeof deleteOrganizationSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type ListMembersInput = z.infer<typeof listMembersSchema>;
export type ListInvitationsInput = z.infer<typeof listInvitationsSchema>;
export type CancelInvitationInput = z.infer<typeof cancelInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type LeaveOrganizationInput = z.infer<typeof leaveOrganizationSchema>;
export type MemberRole = z.infer<typeof memberRoleEnum>;
