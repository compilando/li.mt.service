"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/user";
import { UnauthorizedError, ForbiddenError, NotFoundError } from "@/lib/errors";

/**
 * Require authenticated user session
 * @throws {UnauthorizedError} if no session exists
 * @returns The authenticated session
 */
export async function requireAuth() {
    const session = await getSession();
    if (!session?.user) {
        throw new UnauthorizedError();
    }
    return session;
}

/**
 * Require user to be a member of an organization
 * @throws {ForbiddenError} if user is not a member
 * @returns The membership record
 */
export async function requireOrgMembership(organizationId: string, userId: string) {
    const member = await prisma.member.findFirst({
        where: { organizationId, userId },
    });
    if (!member) {
        throw new ForbiddenError("You are not a member of this organization");
    }
    return member;
}

/**
 * Require user to have specific role(s) in an organization
 * @throws {ForbiddenError} if user doesn't have required role
 * @returns The membership record
 */
export async function requireOrgRole(
    organizationId: string,
    userId: string,
    allowedRoles: string[]
) {
    const member = await requireOrgMembership(organizationId, userId);
    if (!allowedRoles.includes(member.role)) {
        throw new ForbiddenError(
            `Only ${allowedRoles.join(" or ")} can perform this action`
        );
    }
    return member;
}

/**
 * Require user to own a specific link
 * @throws {NotFoundError} if link doesn't exist
 * @throws {ForbiddenError} if user doesn't own the link
 * @returns The link with organization and members
 */
export async function requireLinkOwnership(linkId: string, userId: string) {
    const link = await prisma.link.findUnique({
        where: { id: linkId },
        include: { organization: { include: { members: true } } },
    });
    if (!link) {
        throw new NotFoundError("Link");
    }
    const isMember = link.organization.members.some((m) => m.userId === userId);
    if (!isMember) {
        throw new ForbiddenError();
    }
    return link;
}
