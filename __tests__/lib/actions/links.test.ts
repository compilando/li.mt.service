import { describe, it, expect, beforeEach, vi } from "vitest";
import { createLink, deleteLink, archiveLink } from "@/lib/actions/links";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/user";
import {
    mockAuthenticated,
    mockUnauthenticated,
    mockOrgMembership,
    createMockLink,
    resetAllMocks,
} from "../../helpers";

describe("Links Actions", () => {
    beforeEach(() => {
        resetAllMocks();
    });

    describe("createLink", () => {
        it("requires authentication", async () => {
            mockUnauthenticated();

            const result = await createLink({
                url: "https://example.com",
                organizationId: "org-1",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("signed in");
                expect(result.code).toBe("UNAUTHORIZED");
            }
        });

        it("requires organization membership", async () => {
            mockAuthenticated();
            mockOrgMembership(false);

            const result = await createLink({
                url: "https://example.com",
                organizationId: "org-1",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("not a member");
                expect(result.code).toBe("FORBIDDEN");
            }
        });

        it("creates a link successfully with minimal input", async () => {
            mockAuthenticated();
            mockOrgMembership(true);

            const mockLink = createMockLink();
            vi.mocked(prisma.link.findUnique).mockResolvedValue(null as never);
            vi.mocked(prisma.link.create).mockResolvedValue(mockLink as never);

            const result = await createLink({
                url: "https://example.com",
                organizationId: "org-1",
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBeTruthy();
                expect(result.data.shortCode).toBeTruthy();
            }
        });

        it("creates a link with custom short code", async () => {
            mockAuthenticated();
            mockOrgMembership(true);

            const mockLink = createMockLink({ shortCode: "custom" });
            vi.mocked(prisma.link.findUnique).mockResolvedValue(null as never);
            vi.mocked(prisma.link.create).mockResolvedValue(mockLink as never);

            const result = await createLink({
                url: "https://example.com",
                shortCode: "custom",
                organizationId: "org-1",
            });

            expect(result.success).toBe(true);
            expect(prisma.link.create).toHaveBeenCalled();
        });

        it("rejects reserved short codes", async () => {
            mockAuthenticated();
            mockOrgMembership(true);

            const result = await createLink({
                url: "https://example.com",
                shortCode: "admin",
                organizationId: "org-1",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("reserved");
                expect(result.code).toBe("RESERVED");
            }
        });

        it("rejects duplicate short codes", async () => {
            mockAuthenticated();
            mockOrgMembership(true);

            const existingLink = createMockLink({ shortCode: "taken" });
            vi.mocked(prisma.link.findUnique).mockResolvedValue(existingLink as never);

            const result = await createLink({
                url: "https://example.com",
                shortCode: "taken",
                organizationId: "org-1",
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("already taken");
                expect(result.code).toBe("CONFLICT");
            }
        });

        it("creates link with all optional fields", async () => {
            mockAuthenticated();
            mockOrgMembership(true);

            const mockLink = createMockLink({
                title: "Test Link",
                description: "A test link",
                comments: "Internal notes",
                password: "secret",
                utmSource: "google",
            });
            vi.mocked(prisma.link.findUnique).mockResolvedValue(null as never);
            vi.mocked(prisma.link.create).mockResolvedValue(mockLink as never);

            const result = await createLink({
                url: "https://example.com",
                title: "Test Link",
                description: "A test link",
                comments: "Internal notes",
                password: "secret",
                utmSource: "google",
                organizationId: "org-1",
            });

            expect(result.success).toBe(true);
            expect(prisma.link.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        title: "Test Link",
                        comments: "Internal notes",
                    }),
                })
            );
        });

        it("creates link with tags", async () => {
            mockAuthenticated();
            mockOrgMembership(true);

            const mockLink = createMockLink();
            vi.mocked(prisma.link.findUnique).mockResolvedValue(null as never);
            vi.mocked(prisma.link.create).mockResolvedValue(mockLink as never);

            const result = await createLink({
                url: "https://example.com",
                tagIds: ["tag-1", "tag-2"],
                organizationId: "org-1",
            });

            expect(result.success).toBe(true);
            expect(prisma.link.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        tags: {
                            create: expect.arrayContaining([
                                { tagId: "tag-1" },
                                { tagId: "tag-2" },
                            ]),
                        },
                    }),
                })
            );
        });

        it("validates invalid input", async () => {
            mockAuthenticated();
            mockOrgMembership(true);

            const result = await createLink({
                url: "not-a-url",
                organizationId: "org-1",
            });

            expect(result.success).toBe(false);
        });
    });

    describe("deleteLink", () => {
        it("requires authentication", async () => {
            mockUnauthenticated();

            const result = await deleteLink("link-1");

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("UNAUTHORIZED");
            }
        });

        it("requires link ownership", async () => {
            mockAuthenticated();

            vi.mocked(prisma.link.findUnique).mockResolvedValue(null as never);

            const result = await deleteLink("link-1");

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain("not found");
            }
        });

        it("deletes link successfully", async () => {
            mockAuthenticated();

            const mockLink = createMockLink();
            const mockLinkWithOrg = {
                ...mockLink,
                organization: {
                    members: [{ userId: "user-1" }],
                },
            };
            vi.mocked(prisma.link.findUnique).mockResolvedValue(mockLinkWithOrg as never);
            vi.mocked(prisma.link.delete).mockResolvedValue(mockLink as never);

            const result = await deleteLink("link-1");

            expect(result.success).toBe(true);
            expect(prisma.link.delete).toHaveBeenCalledWith({ where: { id: "link-1" } });
        });
    });

    describe("archiveLink", () => {
        it("requires authentication", async () => {
            mockUnauthenticated();

            const result = await archiveLink("link-1", true);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.code).toBe("UNAUTHORIZED");
            }
        });

        it("archives link successfully", async () => {
            mockAuthenticated();

            const mockLink = createMockLink();
            const mockLinkWithOrg = {
                ...mockLink,
                organization: {
                    members: [{ userId: "user-1" }],
                },
            };
            vi.mocked(prisma.link.findUnique).mockResolvedValue(mockLinkWithOrg as never);
            vi.mocked(prisma.link.update).mockResolvedValue({ ...mockLink, archived: true } as never);

            const result = await archiveLink("link-1", true);

            expect(result.success).toBe(true);
            expect(prisma.link.update).toHaveBeenCalledWith({
                where: { id: "link-1" },
                data: { archived: true },
            });
        });

        it("unarchives link successfully", async () => {
            mockAuthenticated();

            const mockLink = createMockLink({ archived: true });
            const mockLinkWithOrg = {
                ...mockLink,
                organization: {
                    members: [{ userId: "user-1" }],
                },
            };
            vi.mocked(prisma.link.findUnique).mockResolvedValue(mockLinkWithOrg as never);
            vi.mocked(prisma.link.update).mockResolvedValue({ ...mockLink, archived: false } as never);

            const result = await archiveLink("link-1", false);

            expect(result.success).toBe(true);
            expect(prisma.link.update).toHaveBeenCalledWith({
                where: { id: "link-1" },
                data: { archived: false },
            });
        });
    });
});
