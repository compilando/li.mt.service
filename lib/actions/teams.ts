"use server";

import prisma from "@/lib/prisma";
import {
    createOrganizationSchema,
    updateOrganizationSchema,
    deleteOrganizationSchema,
    inviteMemberSchema,
    updateMemberRoleSchema,
    removeMemberSchema,
    listMembersSchema,
    listInvitationsSchema,
    cancelInvitationSchema,
    acceptInvitationSchema,
    leaveOrganizationSchema,
    type CreateOrganizationInput,
    type UpdateOrganizationInput,
    type DeleteOrganizationInput,
    type InviteMemberInput,
    type UpdateMemberRoleInput,
    type RemoveMemberInput,
    type ListMembersInput,
    type ListInvitationsInput,
    type CancelInvitationInput,
    type AcceptInvitationInput,
    type LeaveOrganizationInput,
} from "@/lib/validations/team";
import {
    UnauthorizedError,
    ConflictError,
    NotFoundError,
    ForbiddenError,
    type ActionResult,
} from "@/lib/errors";
import { requireAuth, requireOrgMembership, requireOrgRole } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";
import { generateId } from "better-auth";
import { sendInvitationEmail } from "@/lib/mail";

function generateSlugFromName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50);
}

// ─── Organization CRUD ───────────────────────────────────────────────────────

export async function createOrganization(
    input: CreateOrganizationInput
): Promise<ActionResult<{ id: string; name: string; slug: string }>> {
    try {
        const session = await requireAuth();

        const validationResult = createOrganizationSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, error: firstError || "Validation failed" };
        }

        const parsed = validationResult.data;

        // Generate slug if not provided
        const slug = parsed.slug || generateSlugFromName(parsed.name);

        // Check if slug already exists
        const existingOrg = await prisma.organization.findUnique({
            where: { slug },
        });

        if (existingOrg) {
            throw new ConflictError("An organization with this slug already exists");
        }

        // Create organization
        const organization = await prisma.organization.create({
            data: {
                id: generateId(),
                name: parsed.name,
                slug,
                createdAt: new Date(),
            },
        });

        // Add creator as owner
        await prisma.member.create({
            data: {
                id: generateId(),
                organizationId: organization.id,
                userId: session.user.id,
                role: "owner",
                createdAt: new Date(),
            },
        });

        revalidatePath("/app");

        return {
            success: true,
            data: {
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
            },
        };
    } catch (error) {
        if (error instanceof UnauthorizedError || error instanceof ConflictError) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error creating organization:", error);
        return { success: false, error: "Failed to create organization" };
    }
}

export async function updateOrganization(
    input: UpdateOrganizationInput
): Promise<ActionResult<void>> {
    try {
        const session = await requireAuth();

        const validationResult = updateOrganizationSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, error: firstError || "Validation failed" };
        }

        const parsed = validationResult.data;

        // Check if user is owner or admin
        await requireOrgRole(parsed.id, session.user.id, ["owner", "admin"]);

        // If slug is being updated, check for conflicts
        if (parsed.slug) {
            const existingOrg = await prisma.organization.findFirst({
                where: {
                    slug: parsed.slug,
                    id: { not: parsed.id },
                },
            });

            if (existingOrg) {
                throw new ConflictError("An organization with this slug already exists");
            }
        }

        // Update organization
        await prisma.organization.update({
            where: { id: parsed.id },
            data: {
                ...(parsed.name && { name: parsed.name }),
                ...(parsed.slug && { slug: parsed.slug }),
                ...(parsed.logo !== undefined && { logo: parsed.logo }),
            },
        });

        revalidatePath("/app");
        revalidatePath("/app/settings");

        return { success: true, data: undefined };
    } catch (error) {
        if (
            error instanceof UnauthorizedError ||
            error instanceof ForbiddenError ||
            error instanceof ConflictError
        ) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error updating organization:", error);
        return { success: false, error: "Failed to update organization" };
    }
}

export async function deleteOrganization(
    input: DeleteOrganizationInput
): Promise<ActionResult<void>> {
    try {
        const session = await requireAuth();

        const validationResult = deleteOrganizationSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, error: firstError || "Validation failed" };
        }

        const parsed = validationResult.data;

        // Check if user is owner
        await requireOrgRole(parsed.id, session.user.id, ["owner"]);

        // Get organization to check if it's a personal org
        const organization = await prisma.organization.findUnique({
            where: { id: parsed.id },
        });

        if (!organization) {
            throw new NotFoundError("Organization");
        }

        // Prevent deletion of personal organizations
        if (organization.slug.startsWith("personal-")) {
            throw new ForbiddenError("Cannot delete your personal organization");
        }

        // Delete organization (members, links, etc. will cascade delete)
        await prisma.organization.delete({
            where: { id: parsed.id },
        });

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
        console.error("Error deleting organization:", error);
        return { success: false, error: "Failed to delete organization" };
    }
}

// ─── Member Management ───────────────────────────────────────────────────────

export async function listMembers(
    input: ListMembersInput
): Promise<
    ActionResult<
        Array<{
            id: string;
            role: string;
            createdAt: Date;
            user: {
                id: string;
                name: string | null;
                email: string;
                image: string | null;
            };
        }>
    >
> {
    try {
        const session = await requireAuth();

        const validationResult = listMembersSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, error: firstError || "Validation failed" };
        }

        const parsed = validationResult.data;

        // Check if user is a member
        await requireOrgMembership(parsed.organizationId, session.user.id);

        // Get all members
        const members = await prisma.member.findMany({
            where: { organizationId: parsed.organizationId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
            orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        });

        return { success: true, data: members };
    } catch (error) {
        if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error listing members:", error);
        return { success: false, error: "Failed to list members" };
    }
}

export async function inviteMember(
    input: InviteMemberInput
): Promise<ActionResult<{ id: string }>> {
    try {
        const session = await requireAuth();

        const validationResult = inviteMemberSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, error: firstError || "Validation failed" };
        }

        const parsed = validationResult.data;

        // Check if user is owner or admin
        await requireOrgRole(parsed.organizationId, session.user.id, ["owner", "admin"]);

        // Check if email is already a member
        const existingMember = await prisma.member.findFirst({
            where: {
                organizationId: parsed.organizationId,
                user: { email: parsed.email },
            },
        });

        if (existingMember) {
            throw new ConflictError("This user is already a member of the organization");
        }

        // Check if there's already a pending invitation
        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                organizationId: parsed.organizationId,
                email: parsed.email,
                status: "pending",
                expiresAt: { gt: new Date() },
            },
        });

        if (existingInvitation) {
            throw new ConflictError("An invitation has already been sent to this email");
        }

        // Create invitation (expires in 7 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = await prisma.invitation.create({
            data: {
                id: generateId(),
                organizationId: parsed.organizationId,
                email: parsed.email,
                role: parsed.role,
                status: "pending",
                expiresAt,
                inviterId: session.user.id,
                createdAt: new Date(),
            },
        });

        // Get organization and inviter info for the email
        const organization = await prisma.organization.findUnique({
            where: { id: parsed.organizationId },
        });

        // Send invitation email
        const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app/settings?invitation=${invitation.id}`;
        await sendInvitationEmail({
            to: parsed.email,
            organizationName: organization?.name || "the team",
            inviterName: session.user.name || session.user.email,
            role: parsed.role,
            invitationUrl,
        });

        revalidatePath("/app/settings");

        return { success: true, data: { id: invitation.id } };
    } catch (error) {
        if (
            error instanceof UnauthorizedError ||
            error instanceof ForbiddenError ||
            error instanceof ConflictError
        ) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error inviting member:", error);
        return { success: false, error: "Failed to send invitation" };
    }
}

export async function updateMemberRole(
    input: UpdateMemberRoleInput
): Promise<ActionResult<void>> {
    try {
        const session = await requireAuth();

        const validationResult = updateMemberRoleSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, error: firstError || "Validation failed" };
        }

        const parsed = validationResult.data;

        // Get the member to update
        const targetMember = await prisma.member.findUnique({
            where: { id: parsed.memberId },
        });

        if (!targetMember) {
            throw new NotFoundError("Member");
        }

        // Check if requester is owner
        await requireOrgRole(targetMember.organizationId, session.user.id, ["owner"]);

        // Prevent owner from changing their own role if they're the only owner
        if (targetMember.userId === session.user.id && targetMember.role === "owner") {
            const ownerCount = await prisma.member.count({
                where: {
                    organizationId: targetMember.organizationId,
                    role: "owner",
                },
            });

            if (ownerCount === 1) {
                throw new ForbiddenError(
                    "Cannot change your role as you are the only owner. Transfer ownership first"
                );
            }
        }

        // Update member role
        await prisma.member.update({
            where: { id: parsed.memberId },
            data: { role: parsed.role },
        });

        revalidatePath("/app/settings");

        return { success: true, data: undefined };
    } catch (error) {
        if (
            error instanceof UnauthorizedError ||
            error instanceof ForbiddenError ||
            error instanceof NotFoundError
        ) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error updating member role:", error);
        return { success: false, error: "Failed to update member role" };
    }
}

export async function removeMember(
    input: RemoveMemberInput
): Promise<ActionResult<void>> {
    try {
        const session = await requireAuth();

        const validationResult = removeMemberSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, error: firstError || "Validation failed" };
        }

        const parsed = validationResult.data;

        // Get the member to remove
        const targetMember = await prisma.member.findUnique({
            where: { id: parsed.memberId },
        });

        if (!targetMember) {
            throw new NotFoundError("Member");
        }

        // Check if requester is owner
        await requireOrgRole(targetMember.organizationId, session.user.id, ["owner"]);

        // Prevent removing yourself if you're the only owner
        if (targetMember.userId === session.user.id && targetMember.role === "owner") {
            const ownerCount = await prisma.member.count({
                where: {
                    organizationId: targetMember.organizationId,
                    role: "owner",
                },
            });

            if (ownerCount === 1) {
                throw new ForbiddenError(
                    "Cannot remove yourself as you are the only owner. Transfer ownership or delete the organization"
                );
            }
        }

        // Remove member
        await prisma.member.delete({
            where: { id: parsed.memberId },
        });

        revalidatePath("/app/settings");

        return { success: true, data: undefined };
    } catch (error) {
        if (
            error instanceof UnauthorizedError ||
            error instanceof ForbiddenError ||
            error instanceof NotFoundError
        ) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error removing member:", error);
        return { success: false, error: "Failed to remove member" };
    }
}

export async function leaveOrganization(
    input: LeaveOrganizationInput
): Promise<ActionResult<void>> {
    try {
        const session = await requireAuth();

        const validationResult = leaveOrganizationSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, error: firstError || "Validation failed" };
        }

        const parsed = validationResult.data;

        // Get the member
        const member = await prisma.member.findFirst({
            where: {
                organizationId: parsed.organizationId,
                userId: session.user.id,
            },
        });

        if (!member) {
            throw new NotFoundError("Member");
        }

        // Get organization to check if it's personal
        const organization = await prisma.organization.findUnique({
            where: { id: parsed.organizationId },
        });

        if (!organization) {
            throw new NotFoundError("Organization");
        }

        // Prevent leaving personal organization
        if (organization.slug.startsWith("personal-")) {
            throw new ForbiddenError("Cannot leave your personal organization");
        }

        // Prevent leaving if you're the only owner
        if (member.role === "owner") {
            const ownerCount = await prisma.member.count({
                where: {
                    organizationId: parsed.organizationId,
                    role: "owner",
                },
            });

            if (ownerCount === 1) {
                throw new ForbiddenError(
                    "Cannot leave as you are the only owner. Transfer ownership or delete the organization"
                );
            }
        }

        // Remove member
        await prisma.member.delete({
            where: { id: member.id },
        });

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
        console.error("Error leaving organization:", error);
        return { success: false, error: "Failed to leave organization" };
    }
}

// ─── Invitation Management ───────────────────────────────────────────────────

export async function listInvitations(
    input: ListInvitationsInput
): Promise<
    ActionResult<
        Array<{
            id: string;
            email: string;
            role: string | null;
            status: string;
            expiresAt: Date;
            createdAt: Date;
            inviter: {
                id: string;
                name: string | null;
                email: string;
            };
        }>
    >
> {
    try {
        const session = await requireAuth();

        const validationResult = listInvitationsSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, error: firstError || "Validation failed" };
        }

        const parsed = validationResult.data;

        // Check if user is a member
        await requireOrgMembership(parsed.organizationId, session.user.id);

        // Get all pending invitations
        const invitations = await prisma.invitation.findMany({
            where: {
                organizationId: parsed.organizationId,
                status: "pending",
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            data: invitations.map((inv) => ({
                id: inv.id,
                email: inv.email,
                role: inv.role,
                status: inv.status,
                expiresAt: inv.expiresAt,
                createdAt: inv.createdAt,
                inviter: inv.user,
            })),
        };
    } catch (error) {
        if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error listing invitations:", error);
        return { success: false, error: "Failed to list invitations" };
    }
}

export async function cancelInvitation(
    input: CancelInvitationInput
): Promise<ActionResult<void>> {
    try {
        const session = await requireAuth();

        const validationResult = cancelInvitationSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, error: firstError || "Validation failed" };
        }

        const parsed = validationResult.data;

        // Get the invitation
        const invitation = await prisma.invitation.findUnique({
            where: { id: parsed.invitationId },
        });

        if (!invitation) {
            throw new NotFoundError("Invitation");
        }

        // Check if user is owner or admin
        await requireOrgRole(invitation.organizationId, session.user.id, ["owner", "admin"]);

        // Delete invitation
        await prisma.invitation.delete({
            where: { id: parsed.invitationId },
        });

        revalidatePath("/app/settings");

        return { success: true, data: undefined };
    } catch (error) {
        if (
            error instanceof UnauthorizedError ||
            error instanceof ForbiddenError ||
            error instanceof NotFoundError
        ) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error canceling invitation:", error);
        return { success: false, error: "Failed to cancel invitation" };
    }
}

export async function acceptInvitation(
    input: AcceptInvitationInput
): Promise<ActionResult<{ organizationId: string }>> {
    try {
        const session = await requireAuth();

        const validationResult = acceptInvitationSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = Object.values(validationResult.error.flatten().fieldErrors)[0]?.[0];
            return { success: false, error: firstError || "Validation failed" };
        }

        const parsed = validationResult.data;

        // Get the invitation
        const invitation = await prisma.invitation.findUnique({
            where: { id: parsed.invitationId },
        });

        if (!invitation) {
            throw new NotFoundError("Invitation");
        }

        // Check if invitation is for the current user
        if (invitation.email !== session.user.email) {
            throw new ForbiddenError("This invitation is not for you");
        }

        // Check if invitation is still valid
        if (invitation.status !== "pending") {
            throw new ForbiddenError("This invitation has already been accepted or canceled");
        }

        if (invitation.expiresAt < new Date()) {
            throw new ForbiddenError("This invitation has expired");
        }

        // Check if user is already a member
        const existingMember = await prisma.member.findFirst({
            where: {
                organizationId: invitation.organizationId,
                userId: session.user.id,
            },
        });

        if (existingMember) {
            throw new ConflictError("You are already a member of this organization");
        }

        // Create member
        await prisma.member.create({
            data: {
                id: generateId(),
                organizationId: invitation.organizationId,
                userId: session.user.id,
                role: invitation.role || "member",
                createdAt: new Date(),
            },
        });

        // Update invitation status
        await prisma.invitation.update({
            where: { id: parsed.invitationId },
            data: { status: "accepted" },
        });

        revalidatePath("/app");

        return { success: true, data: { organizationId: invitation.organizationId } };
    } catch (error) {
        if (
            error instanceof UnauthorizedError ||
            error instanceof ForbiddenError ||
            error instanceof NotFoundError ||
            error instanceof ConflictError
        ) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error accepting invitation:", error);
        return { success: false, error: "Failed to accept invitation" };
    }
}
