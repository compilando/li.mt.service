"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/user";
import {
    createRoutingRuleSchema,
    updateRoutingRuleSchema,
    deleteRoutingRuleSchema,
    reorderRoutingRulesSchema,
    createConditionAliasSchema,
    updateConditionAliasSchema,
    deleteConditionAliasSchema,
    getAliasesSchema,
    type CreateRoutingRuleInput,
    type UpdateRoutingRuleInput,
    type ReorderRoutingRulesInput,
    type CreateConditionAliasInput,
    type UpdateConditionAliasInput,
    type GetAliasesInput,
} from "@/lib/validations/routing";
import {
    UnauthorizedError,
    NotFoundError,
    ForbiddenError,
    type ActionResult,
} from "@/lib/errors";
import { revalidatePath } from "next/cache";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireAuth() {
    const session = await getSession();
    if (!session?.user) {
        throw new UnauthorizedError();
    }
    return session;
}

async function requireOrgMembership(organizationId: string, userId: string) {
    const member = await prisma.member.findFirst({
        where: { organizationId, userId },
    });
    if (!member) {
        throw new ForbiddenError("You are not a member of this organization");
    }
    return member;
}

async function requireLinkOwnership(linkId: string, userId: string) {
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

// ─── Routing Rules ───────────────────────────────────────────────────────────

export async function createRoutingRule(
    input: CreateRoutingRuleInput
): Promise<ActionResult<{ id: string }>> {
    try {
        const session = await requireAuth();
        const parsed = createRoutingRuleSchema.parse(input);
        await requireLinkOwnership(parsed.linkId, session.user.id);

        const { conditions, ...ruleData } = parsed;

        const rule = await prisma.routingRule.create({
            data: {
                ...ruleData,
                conditions: {
                    create: conditions.map((cond) => ({
                        variable: cond.variable,
                        operator: cond.operator,
                        value: cond.value,
                    })),
                },
            },
        });

        revalidatePath("/app/links");
        return { success: true, data: { id: rule.id } };
    } catch (error: any) {
        if (error.code) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error creating routing rule:", error);
        return { success: false, error: "Failed to create routing rule" };
    }
}

export async function updateRoutingRule(
    input: UpdateRoutingRuleInput
): Promise<ActionResult<{ id: string }>> {
    try {
        const session = await requireAuth();
        const parsed = updateRoutingRuleSchema.parse(input);

        const existingRule = await prisma.routingRule.findUnique({
            where: { id: parsed.id },
            include: { link: { include: { organization: { include: { members: true } } } } },
        });

        if (!existingRule) {
            throw new NotFoundError("Routing rule");
        }

        const isMember = existingRule.link.organization.members.some(
            (m) => m.userId === session.user.id
        );
        if (!isMember) {
            throw new ForbiddenError();
        }

        const { id, conditions, ...updateData } = parsed;

        await prisma.routingRule.update({
            where: { id },
            data: {
                ...updateData,
                conditions: conditions
                    ? {
                        deleteMany: {},
                        create: conditions.map((cond) => ({
                            variable: cond.variable,
                            operator: cond.operator,
                            value: cond.value,
                        })),
                    }
                    : undefined,
            },
        });

        revalidatePath("/app/links");
        return { success: true, data: { id } };
    } catch (error: any) {
        if (error.code) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error updating routing rule:", error);
        return { success: false, error: "Failed to update routing rule" };
    }
}

export async function deleteRoutingRule(id: string): Promise<ActionResult> {
    try {
        const session = await requireAuth();

        const rule = await prisma.routingRule.findUnique({
            where: { id },
            include: { link: { include: { organization: { include: { members: true } } } } },
        });

        if (!rule) {
            throw new NotFoundError("Routing rule");
        }

        const isMember = rule.link.organization.members.some((m) => m.userId === session.user.id);
        if (!isMember) {
            throw new ForbiddenError();
        }

        await prisma.routingRule.delete({ where: { id } });

        revalidatePath("/app/links");
        return { success: true, data: undefined };
    } catch (error: any) {
        if (error.code) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error deleting routing rule:", error);
        return { success: false, error: "Failed to delete routing rule" };
    }
}

export async function reorderRoutingRules(
    input: ReorderRoutingRulesInput
): Promise<ActionResult> {
    try {
        const session = await requireAuth();
        const parsed = reorderRoutingRulesSchema.parse(input);
        await requireLinkOwnership(parsed.linkId, session.user.id);

        // Update priorities in order
        await Promise.all(
            parsed.ruleIds.map((ruleId, index) =>
                prisma.routingRule.update({
                    where: { id: ruleId },
                    data: { priority: index },
                })
            )
        );

        revalidatePath("/app/links");
        return { success: true, data: undefined };
    } catch (error: any) {
        if (error.code) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error reordering routing rules:", error);
        return { success: false, error: "Failed to reorder routing rules" };
    }
}

export async function getRoutingRules(linkId: string) {
    const session = await requireAuth();
    await requireLinkOwnership(linkId, session.user.id);

    const rules = await prisma.routingRule.findMany({
        where: { linkId },
        include: { conditions: true },
        orderBy: { priority: "asc" },
    });

    return rules;
}

// ─── Condition Aliases ───────────────────────────────────────────────────────

export async function createConditionAlias(
    input: CreateConditionAliasInput
): Promise<ActionResult<{ id: string }>> {
    try {
        const session = await requireAuth();
        const parsed = createConditionAliasSchema.parse(input);

        if (parsed.organizationId) {
            await requireOrgMembership(parsed.organizationId, session.user.id);
        }

        const alias = await prisma.conditionAlias.create({
            data: parsed,
        });

        return { success: true, data: { id: alias.id } };
    } catch (error: any) {
        if (error.code) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error creating condition alias:", error);
        return { success: false, error: "Failed to create condition alias" };
    }
}

export async function updateConditionAlias(
    input: UpdateConditionAliasInput
): Promise<ActionResult<{ id: string }>> {
    try {
        const session = await requireAuth();
        const parsed = updateConditionAliasSchema.parse(input);

        const existingAlias = await prisma.conditionAlias.findUnique({
            where: { id: parsed.id },
        });

        if (!existingAlias) {
            throw new NotFoundError("Condition alias");
        }

        if (existingAlias.isSystem) {
            throw new ForbiddenError("Cannot edit system aliases");
        }

        if (existingAlias.organizationId) {
            await requireOrgMembership(existingAlias.organizationId, session.user.id);
        }

        const { id, ...updateData } = parsed;

        await prisma.conditionAlias.update({
            where: { id },
            data: updateData,
        });

        return { success: true, data: { id } };
    } catch (error: any) {
        if (error.code) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error updating condition alias:", error);
        return { success: false, error: "Failed to update condition alias" };
    }
}

export async function deleteConditionAlias(id: string): Promise<ActionResult> {
    try {
        const session = await requireAuth();

        const alias = await prisma.conditionAlias.findUnique({
            where: { id },
        });

        if (!alias) {
            throw new NotFoundError("Condition alias");
        }

        if (alias.isSystem) {
            throw new ForbiddenError("Cannot delete system aliases");
        }

        if (alias.organizationId) {
            await requireOrgMembership(alias.organizationId, session.user.id);
        }

        await prisma.conditionAlias.delete({ where: { id } });

        return { success: true, data: undefined };
    } catch (error: any) {
        if (error.code) {
            return { success: false, error: error.message, code: error.code };
        }
        console.error("Error deleting condition alias:", error);
        return { success: false, error: "Failed to delete condition alias" };
    }
}

export async function getConditionAliases(input: GetAliasesInput) {
    const session = await requireAuth();
    const parsed = getAliasesSchema.parse(input);

    if (parsed.organizationId) {
        await requireOrgMembership(parsed.organizationId, session.user.id);
    }

    const where: any = {};

    if (parsed.category) {
        where.category = parsed.category;
    }

    if (parsed.includeSystem) {
        where.OR = [{ isSystem: true }];
        if (parsed.organizationId) {
            where.OR.push({ organizationId: parsed.organizationId });
        }
    } else if (parsed.organizationId) {
        where.organizationId = parsed.organizationId;
    }

    const aliases = await prisma.conditionAlias.findMany({
        where,
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });

    return aliases;
}
