"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/user";
import { createTagSchema, type CreateTagInput } from "@/lib/validations/tag";
import { UnauthorizedError, ForbiddenError, type ActionResult } from "@/lib/errors";
import { revalidatePath } from "next/cache";

async function requireAuth() {
    const session = await getSession();
    if (!session?.user) {
        throw new UnauthorizedError();
    }
    return session;
}

export async function createTag(input: CreateTagInput): Promise<ActionResult<{ id: string }>> {
    try {
        const session = await requireAuth();
        const parsed = createTagSchema.parse(input);

        const member = await prisma.member.findFirst({
            where: { organizationId: parsed.organizationId, userId: session.user.id },
        });
        if (!member) {
            throw new ForbiddenError();
        }

        const tag = await prisma.tag.create({
            data: parsed,
        });

        revalidatePath("/app/links");
        return { success: true, data: { id: tag.id } };
    } catch (error: any) {
        if (error.code === "P2002") {
            return { success: false, error: "A tag with this name already exists" };
        }
        if (error.code) {
            return { success: false, error: error.message, code: error.code };
        }
        return { success: false, error: "Failed to create tag" };
    }
}

export async function deleteTag(id: string): Promise<ActionResult> {
    try {
        const session = await requireAuth();

        const tag = await prisma.tag.findUnique({
            where: { id },
            include: { organization: { include: { members: true } } },
        });

        if (!tag) {
            return { success: false, error: "Tag not found" };
        }

        const isMember = tag.organization.members.some((m) => m.userId === session.user.id);
        if (!isMember) {
            throw new ForbiddenError();
        }

        await prisma.tag.delete({ where: { id } });

        revalidatePath("/app/links");
        return { success: true, data: undefined };
    } catch (error: any) {
        if (error.code) {
            return { success: false, error: error.message, code: error.code };
        }
        return { success: false, error: "Failed to delete tag" };
    }
}

export async function getTagsByOrganization(organizationId: string) {
    const session = await requireAuth();

    const member = await prisma.member.findFirst({
        where: { organizationId, userId: session.user.id },
    });
    if (!member) {
        throw new ForbiddenError();
    }

    return prisma.tag.findMany({
        where: { organizationId },
        include: { _count: { select: { links: true } } },
        orderBy: { name: "asc" },
    });
}
