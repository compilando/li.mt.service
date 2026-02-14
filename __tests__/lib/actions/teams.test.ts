import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    createOrganization,
    updateOrganization,
    deleteOrganization,
    listMembers,
    inviteMember,
    updateMemberRole,
    removeMember,
    leaveOrganization,
    listInvitations,
    cancelInvitation,
    acceptInvitation,
} from "@/lib/actions/teams";
import {
    mockAuthenticated,
    mockUnauthenticated,
    mockOrgMembership,
    createMockOrganization,
    createMockMember,
    createMockInvitation,
    mockOrgMembershipWithData,
} from "@/__tests__/helpers";
import prisma from "@/lib/prisma";

describe("Team Actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("createOrganization", () => {
        it("requires authentication", async () => {
            mockUnauthenticated();

            const result = await createOrganization({ name: "New Team" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("UNAUTHORIZED");
            }
        });

        it("creates organization with generated slug", async () => {
            mockAuthenticated();
            vi.mocked(prisma.organization.findUnique).mockResolvedValue(null as never);
            vi.mocked(prisma.organization.create).mockResolvedValue(
                createMockOrganization({ name: "New Team", slug: "new-team" }) as never
            );
            vi.mocked(prisma.member.create).mockResolvedValue(createMockMember() as never);

            const result = await createOrganization({ name: "New Team" });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe("New Team");
                expect(result.data.slug).toBe("new-team");
            }
        });

        it("creates organization with custom slug", async () => {
            mockAuthenticated();
            vi.mocked(prisma.organization.findUnique).mockResolvedValue(null as never);
            vi.mocked(prisma.organization.create).mockResolvedValue(
                createMockOrganization({ name: "New Team", slug: "custom-slug" }) as never
            );
            vi.mocked(prisma.member.create).mockResolvedValue(createMockMember() as never);

            const result = await createOrganization({ name: "New Team", slug: "custom-slug" });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.slug).toBe("custom-slug");
            }
        });

        it("rejects duplicate slug", async () => {
            mockAuthenticated();
            vi.mocked(prisma.organization.findUnique).mockResolvedValue(
                createMockOrganization({ slug: "existing-slug" }) as never
            );

            const result = await createOrganization({ name: "New Team", slug: "existing-slug" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("CONFLICT");
                expect(result.error).toContain("already exists");
            }
        });

        it("validates input schema", async () => {
            mockAuthenticated();

            const result = await createOrganization({ name: "ab" }); // Too short

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("at least 3 characters");
            }
        });
    });

    describe("updateOrganization", () => {
        it("requires authentication", async () => {
            mockUnauthenticated();

            const result = await updateOrganization({ id: "org-1", name: "Updated" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("UNAUTHORIZED");
            }
        });

        it("requires owner or admin role", async () => {
            mockAuthenticated();
            mockOrgMembership(true, "member");

            const result = await updateOrganization({ id: "org-1", name: "Updated" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("FORBIDDEN");
            }
        });

        it("updates organization name as owner", async () => {
            mockAuthenticated();
            mockOrgMembership(true, "owner");
            vi.mocked(prisma.organization.update).mockResolvedValue(
                createMockOrganization({ name: "Updated" }) as never
            );

            const result = await updateOrganization({ id: "org-1", name: "Updated" });

            expect(result.success).toBe(true);
        });

        it("updates organization as admin", async () => {
            mockAuthenticated();
            mockOrgMembership(true, "admin");
            vi.mocked(prisma.organization.update).mockResolvedValue(
                createMockOrganization({ name: "Updated" }) as never
            );

            const result = await updateOrganization({ id: "org-1", name: "Updated" });

            expect(result.success).toBe(true);
        });

        it("rejects duplicate slug", async () => {
            mockAuthenticated();
            mockOrgMembership(true, "owner");
            vi.mocked(prisma.organization.findFirst).mockResolvedValue(
                createMockOrganization({ id: "org-2", slug: "existing-slug" }) as never
            );

            const result = await updateOrganization({ id: "org-1", slug: "existing-slug" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("CONFLICT");
            }
        });
    });

    describe("deleteOrganization", () => {
        it("requires authentication", async () => {
            mockUnauthenticated();

            const result = await deleteOrganization({ id: "org-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("UNAUTHORIZED");
            }
        });

        it("requires owner role", async () => {
            mockAuthenticated();
            mockOrgMembership(true, "admin");

            const result = await deleteOrganization({ id: "org-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("FORBIDDEN");
            }
        });

        it("prevents deletion of personal organization", async () => {
            mockAuthenticated();
            mockOrgMembership(true, "owner");
            vi.mocked(prisma.organization.findUnique).mockResolvedValue(
                createMockOrganization({ slug: "personal-user-1" }) as never
            );

            const result = await deleteOrganization({ id: "org-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("Cannot delete your personal organization");
            }
        });

        it("deletes non-personal organization as owner", async () => {
            mockAuthenticated();
            mockOrgMembership(true, "owner");
            vi.mocked(prisma.organization.findUnique).mockResolvedValue(
                createMockOrganization({ slug: "my-team" }) as never
            );
            vi.mocked(prisma.organization.delete).mockResolvedValue(
                createMockOrganization() as never
            );

            const result = await deleteOrganization({ id: "org-1" });

            expect(result.success).toBe(true);
        });
    });

    describe("listMembers", () => {
        it("requires authentication", async () => {
            mockUnauthenticated();

            const result = await listMembers({ organizationId: "org-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("UNAUTHORIZED");
            }
        });

        it("requires organization membership", async () => {
            mockAuthenticated();
            mockOrgMembership(false);

            const result = await listMembers({ organizationId: "org-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("FORBIDDEN");
            }
        });

        it("returns list of members", async () => {
            mockAuthenticated();
            mockOrgMembership(true);
            vi.mocked(prisma.member.findMany).mockResolvedValue([
                {
                    ...createMockMember(),
                    user: {
                        id: "user-1",
                        name: "Test User",
                        email: "test@example.com",
                        image: null,
                    },
                },
            ] as never);

            const result = await listMembers({ organizationId: "org-1" });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(1);
                expect(result.data[0].user.email).toBe("test@example.com");
            }
        });
    });

    describe("inviteMember", () => {
        it("requires authentication", async () => {
            mockUnauthenticated();

            const result = await inviteMember({
                organizationId: "org-1",
                email: "new@example.com",
                role: "member",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("UNAUTHORIZED");
            }
        });

        it("requires owner or admin role", async () => {
            mockAuthenticated();
            mockOrgMembership(true, "member");

            const result = await inviteMember({
                organizationId: "org-1",
                email: "new@example.com",
                role: "member",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("FORBIDDEN");
            }
        });

        it("prevents inviting existing member", async () => {
            mockAuthenticated();
            mockOrgMembership(true, "owner");
            vi.mocked(prisma.member.findFirst).mockResolvedValueOnce(
                createMockMember() as never
            ).mockResolvedValueOnce(createMockMember() as never);

            const result = await inviteMember({
                organizationId: "org-1",
                email: "existing@example.com",
                role: "member",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("already a member");
            }
        });

        it("prevents duplicate pending invitations", async () => {
            mockAuthenticated();
            mockOrgMembership(true, "owner");
            vi.mocked(prisma.member.findFirst).mockResolvedValueOnce(
                createMockMember() as never
            ).mockResolvedValueOnce(null as never);
            vi.mocked(prisma.invitation.findFirst).mockResolvedValue(
                createMockInvitation() as never
            );

            const result = await inviteMember({
                organizationId: "org-1",
                email: "invited@example.com",
                role: "member",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("already been sent");
            }
        });

        it("creates invitation successfully", async () => {
            mockAuthenticated();
            mockOrgMembership(true, "owner");
            vi.mocked(prisma.member.findFirst).mockResolvedValueOnce(
                createMockMember() as never
            ).mockResolvedValueOnce(null as never);
            vi.mocked(prisma.invitation.findFirst).mockResolvedValue(null as never);
            vi.mocked(prisma.invitation.create).mockResolvedValue(
                createMockInvitation() as never
            );

            const result = await inviteMember({
                organizationId: "org-1",
                email: "new@example.com",
                role: "member",
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBeDefined();
            }
        });
    });

    describe("updateMemberRole", () => {
        it("requires authentication", async () => {
            mockUnauthenticated();

            const result = await updateMemberRole({
                memberId: "member-1",
                role: "admin",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("UNAUTHORIZED");
            }
        });

        it("requires owner role", async () => {
            mockAuthenticated();
            vi.mocked(prisma.member.findUnique).mockResolvedValue(
                createMockMember() as never
            );
            mockOrgMembership(true, "admin");

            const result = await updateMemberRole({
                memberId: "member-1",
                role: "admin",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("FORBIDDEN");
            }
        });

        it("prevents owner from changing own role if sole owner", async () => {
            mockAuthenticated();
            vi.mocked(prisma.member.findUnique).mockResolvedValue(
                createMockMember({ userId: "user-1", role: "owner" }) as never
            );
            mockOrgMembership(true, "owner");
            vi.mocked(prisma.member.count).mockResolvedValue(1 as never);

            const result = await updateMemberRole({
                memberId: "member-1",
                role: "admin",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("only owner");
            }
        });

        it("updates member role successfully", async () => {
            mockAuthenticated();
            vi.mocked(prisma.member.findUnique).mockResolvedValue(
                createMockMember({ userId: "user-2" }) as never
            );
            mockOrgMembership(true, "owner");
            vi.mocked(prisma.member.update).mockResolvedValue(
                createMockMember({ role: "admin" }) as never
            );

            const result = await updateMemberRole({
                memberId: "member-1",
                role: "admin",
            });

            expect(result.success).toBe(true);
        });
    });

    describe("removeMember", () => {
        it("requires authentication", async () => {
            mockUnauthenticated();

            const result = await removeMember({ memberId: "member-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("UNAUTHORIZED");
            }
        });

        it("requires owner role", async () => {
            mockAuthenticated();
            vi.mocked(prisma.member.findUnique).mockResolvedValue(
                createMockMember() as never
            );
            mockOrgMembership(true, "admin");

            const result = await removeMember({ memberId: "member-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("FORBIDDEN");
            }
        });

        it("prevents removing sole owner", async () => {
            mockAuthenticated();
            vi.mocked(prisma.member.findUnique).mockResolvedValue(
                createMockMember({ userId: "user-1", role: "owner" }) as never
            );
            mockOrgMembership(true, "owner");
            vi.mocked(prisma.member.count).mockResolvedValue(1 as never);

            const result = await removeMember({ memberId: "member-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("only owner");
            }
        });

        it("removes member successfully", async () => {
            mockAuthenticated();
            vi.mocked(prisma.member.findUnique).mockResolvedValue(
                createMockMember({ userId: "user-2" }) as never
            );
            mockOrgMembership(true, "owner");
            vi.mocked(prisma.member.delete).mockResolvedValue(createMockMember() as never);

            const result = await removeMember({ memberId: "member-1" });

            expect(result.success).toBe(true);
        });
    });

    describe("leaveOrganization", () => {
        it("requires authentication", async () => {
            mockUnauthenticated();

            const result = await leaveOrganization({ organizationId: "org-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("UNAUTHORIZED");
            }
        });

        it("prevents leaving personal organization", async () => {
            mockAuthenticated();
            vi.mocked(prisma.member.findFirst).mockResolvedValue(
                createMockMember() as never
            );
            vi.mocked(prisma.organization.findUnique).mockResolvedValue(
                createMockOrganization({ slug: "personal-user-1" }) as never
            );

            const result = await leaveOrganization({ organizationId: "org-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("Cannot leave your personal organization");
            }
        });

        it("prevents sole owner from leaving", async () => {
            mockAuthenticated();
            vi.mocked(prisma.member.findFirst).mockResolvedValue(
                createMockMember({ role: "owner" }) as never
            );
            vi.mocked(prisma.organization.findUnique).mockResolvedValue(
                createMockOrganization({ slug: "my-team" }) as never
            );
            vi.mocked(prisma.member.count).mockResolvedValue(1 as never);

            const result = await leaveOrganization({ organizationId: "org-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("only owner");
            }
        });

        it("allows member to leave", async () => {
            mockAuthenticated();
            vi.mocked(prisma.member.findFirst).mockResolvedValue(
                createMockMember({ role: "member" }) as never
            );
            vi.mocked(prisma.organization.findUnique).mockResolvedValue(
                createMockOrganization({ slug: "my-team" }) as never
            );
            vi.mocked(prisma.member.delete).mockResolvedValue(createMockMember() as never);

            const result = await leaveOrganization({ organizationId: "org-1" });

            expect(result.success).toBe(true);
        });
    });

    describe("listInvitations", () => {
        it("requires authentication", async () => {
            mockUnauthenticated();

            const result = await listInvitations({ organizationId: "org-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("UNAUTHORIZED");
            }
        });

        it("requires organization membership", async () => {
            mockAuthenticated();
            mockOrgMembership(false);

            const result = await listInvitations({ organizationId: "org-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("FORBIDDEN");
            }
        });

        it("returns list of pending invitations", async () => {
            mockAuthenticated();
            mockOrgMembership(true);
            vi.mocked(prisma.invitation.findMany).mockResolvedValue([
                {
                    ...createMockInvitation(),
                    user: {
                        id: "user-1",
                        name: "Test User",
                        email: "test@example.com",
                    },
                },
            ] as never);

            const result = await listInvitations({ organizationId: "org-1" });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(1);
                expect(result.data[0].email).toBe("invitee@example.com");
            }
        });
    });

    describe("cancelInvitation", () => {
        it("requires authentication", async () => {
            mockUnauthenticated();

            const result = await cancelInvitation({ invitationId: "inv-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("UNAUTHORIZED");
            }
        });

        it("requires owner or admin role", async () => {
            mockAuthenticated();
            vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
                createMockInvitation() as never
            );
            mockOrgMembership(true, "member");

            const result = await cancelInvitation({ invitationId: "inv-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("FORBIDDEN");
            }
        });

        it("cancels invitation successfully", async () => {
            mockAuthenticated();
            vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
                createMockInvitation() as never
            );
            mockOrgMembership(true, "owner");
            vi.mocked(prisma.invitation.delete).mockResolvedValue(
                createMockInvitation() as never
            );

            const result = await cancelInvitation({ invitationId: "inv-1" });

            expect(result.success).toBe(true);
        });
    });

    describe("acceptInvitation", () => {
        it("requires authentication", async () => {
            mockUnauthenticated();

            const result = await acceptInvitation({ invitationId: "inv-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("UNAUTHORIZED");
            }
        });

        it("validates invitation is for current user", async () => {
            mockAuthenticated({ email: "test@example.com" });
            vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
                createMockInvitation({ email: "other@example.com" }) as never
            );

            const result = await acceptInvitation({ invitationId: "inv-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("not for you");
            }
        });

        it("rejects expired invitation", async () => {
            mockAuthenticated({ email: "test@example.com" });
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
                createMockInvitation({
                    email: "test@example.com",
                    expiresAt: pastDate,
                }) as never
            );

            const result = await acceptInvitation({ invitationId: "inv-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("expired");
            }
        });

        it("prevents accepting if already a member", async () => {
            mockAuthenticated({ email: "test@example.com" });
            vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
                createMockInvitation({ email: "test@example.com" }) as never
            );
            vi.mocked(prisma.member.findFirst).mockResolvedValue(
                createMockMember() as never
            );

            const result = await acceptInvitation({ invitationId: "inv-1" });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("already a member");
            }
        });

        it("accepts invitation successfully", async () => {
            mockAuthenticated({ email: "test@example.com" });
            vi.mocked(prisma.invitation.findUnique).mockResolvedValue(
                createMockInvitation({ email: "test@example.com" }) as never
            );
            vi.mocked(prisma.member.findFirst).mockResolvedValue(null as never);
            vi.mocked(prisma.member.create).mockResolvedValue(createMockMember() as never);
            vi.mocked(prisma.invitation.update).mockResolvedValue(
                createMockInvitation({ status: "accepted" }) as never
            );

            const result = await acceptInvitation({ invitationId: "inv-1" });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.organizationId).toBe("org-1");
            }
        });
    });
});
