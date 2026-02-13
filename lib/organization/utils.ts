import prisma from "@/lib/prisma";
import { generateId } from "better-auth";

export interface CreatePersonalOrgOptions {
  userId: string;
  userName?: string;
}

/**
 * Creates a personal organization for a user
 */
export async function createPersonalOrganization({
  userId,
}: CreatePersonalOrgOptions) {
  // Create the personal organization
  const personalOrg = await prisma.organization.create({
    data: {
      id: generateId(),
      name: "Personal",
      slug: `personal-${userId}`,
      createdAt: new Date(),
    },
  });

  // Add the user as an owner of their personal organization
  const membership = await prisma.member.create({
    data: {
      id: generateId(),
      organizationId: personalOrg.id,
      userId: userId,
      role: "owner",
      createdAt: new Date(),
    },
  });

  return {
    organization: personalOrg,
    membership,
  };
}
