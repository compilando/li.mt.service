import { describe, it, expect } from "vitest";
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
    memberRoleEnum,
} from "@/lib/validations/team";

describe("Team Validations", () => {
    describe("createOrganizationSchema", () => {
        it("accepts valid input with name only", () => {
            const input = { name: "My Team" };
            expect(() => createOrganizationSchema.parse(input)).not.toThrow();
        });

        it("accepts valid input with custom slug", () => {
            const input = { name: "My Team", slug: "my-team-123" };
            expect(() => createOrganizationSchema.parse(input)).not.toThrow();
        });

        it("rejects name that is too short", () => {
            const input = { name: "ab" };
            expect(() => createOrganizationSchema.parse(input)).toThrow();
        });

        it("rejects name that is too long", () => {
            const input = { name: "a".repeat(51) };
            expect(() => createOrganizationSchema.parse(input)).toThrow();
        });

        it("rejects slug with invalid characters", () => {
            const input = { name: "My Team", slug: "my_team!" };
            expect(() => createOrganizationSchema.parse(input)).toThrow();
        });

        it("rejects slug with uppercase letters", () => {
            const input = { name: "My Team", slug: "MyTeam" };
            expect(() => createOrganizationSchema.parse(input)).toThrow();
        });

        it("accepts slug with lowercase, numbers, and hyphens", () => {
            const input = { name: "My Team", slug: "my-team-2024" };
            expect(() => createOrganizationSchema.parse(input)).not.toThrow();
        });

        it("trims whitespace from name", () => {
            const input = { name: "  My Team  " };
            const result = createOrganizationSchema.parse(input);
            expect(result.name).toBe("My Team");
        });
    });

    describe("updateOrganizationSchema", () => {
        it("accepts valid input with id and name", () => {
            const input = { id: "org-123", name: "Updated Name" };
            expect(() => updateOrganizationSchema.parse(input)).not.toThrow();
        });

        it("accepts valid input with id and slug", () => {
            const input = { id: "org-123", slug: "updated-slug" };
            expect(() => updateOrganizationSchema.parse(input)).not.toThrow();
        });

        it("accepts valid input with id and logo URL", () => {
            const input = { id: "org-123", logo: "https://example.com/logo.png" };
            expect(() => updateOrganizationSchema.parse(input)).not.toThrow();
        });

        it("accepts null logo", () => {
            const input = { id: "org-123", logo: null };
            expect(() => updateOrganizationSchema.parse(input)).not.toThrow();
        });

        it("rejects invalid logo URL", () => {
            const input = { id: "org-123", logo: "not-a-url" };
            expect(() => updateOrganizationSchema.parse(input)).toThrow();
        });

        it("rejects missing id", () => {
            const input = { name: "Updated Name" };
            expect(() => updateOrganizationSchema.parse(input)).toThrow();
        });

        it("rejects empty id", () => {
            const input = { id: "", name: "Updated Name" };
            expect(() => updateOrganizationSchema.parse(input)).toThrow();
        });
    });

    describe("deleteOrganizationSchema", () => {
        it("accepts valid input", () => {
            const input = { id: "org-123" };
            expect(() => deleteOrganizationSchema.parse(input)).not.toThrow();
        });

        it("rejects missing id", () => {
            const input = {};
            expect(() => deleteOrganizationSchema.parse(input)).toThrow();
        });

        it("rejects empty id", () => {
            const input = { id: "" };
            expect(() => deleteOrganizationSchema.parse(input)).toThrow();
        });
    });

    describe("memberRoleEnum", () => {
        it("accepts owner role", () => {
            expect(() => memberRoleEnum.parse("owner")).not.toThrow();
        });

        it("accepts admin role", () => {
            expect(() => memberRoleEnum.parse("admin")).not.toThrow();
        });

        it("accepts member role", () => {
            expect(() => memberRoleEnum.parse("member")).not.toThrow();
        });

        it("rejects invalid role", () => {
            expect(() => memberRoleEnum.parse("superadmin")).toThrow();
        });
    });

    describe("inviteMemberSchema", () => {
        it("accepts valid input with default role", () => {
            const input = {
                organizationId: "org-123",
                email: "user@example.com",
            };
            const result = inviteMemberSchema.parse(input);
            expect(result.role).toBe("member");
        });

        it("accepts valid input with custom role", () => {
            const input = {
                organizationId: "org-123",
                email: "user@example.com",
                role: "admin" as const,
            };
            expect(() => inviteMemberSchema.parse(input)).not.toThrow();
        });

        it("rejects invalid email", () => {
            const input = {
                organizationId: "org-123",
                email: "not-an-email",
            };
            expect(() => inviteMemberSchema.parse(input)).toThrow();
        });

        it("rejects missing organizationId", () => {
            const input = { email: "user@example.com" };
            expect(() => inviteMemberSchema.parse(input)).toThrow();
        });

        it("rejects invalid role", () => {
            const input = {
                organizationId: "org-123",
                email: "user@example.com",
                role: "superuser",
            };
            expect(() => inviteMemberSchema.parse(input)).toThrow();
        });
    });

    describe("updateMemberRoleSchema", () => {
        it("accepts valid input", () => {
            const input = { memberId: "member-123", role: "admin" as const };
            expect(() => updateMemberRoleSchema.parse(input)).not.toThrow();
        });

        it("rejects missing memberId", () => {
            const input = { role: "admin" as const };
            expect(() => updateMemberRoleSchema.parse(input)).toThrow();
        });

        it("rejects missing role", () => {
            const input = { memberId: "member-123" };
            expect(() => updateMemberRoleSchema.parse(input)).toThrow();
        });

        it("rejects invalid role", () => {
            const input = { memberId: "member-123", role: "invalid" };
            expect(() => updateMemberRoleSchema.parse(input)).toThrow();
        });
    });

    describe("removeMemberSchema", () => {
        it("accepts valid input", () => {
            const input = { memberId: "member-123" };
            expect(() => removeMemberSchema.parse(input)).not.toThrow();
        });

        it("rejects missing memberId", () => {
            const input = {};
            expect(() => removeMemberSchema.parse(input)).toThrow();
        });

        it("rejects empty memberId", () => {
            const input = { memberId: "" };
            expect(() => removeMemberSchema.parse(input)).toThrow();
        });
    });

    describe("listMembersSchema", () => {
        it("accepts valid input", () => {
            const input = { organizationId: "org-123" };
            expect(() => listMembersSchema.parse(input)).not.toThrow();
        });

        it("rejects missing organizationId", () => {
            const input = {};
            expect(() => listMembersSchema.parse(input)).toThrow();
        });
    });

    describe("listInvitationsSchema", () => {
        it("accepts valid input", () => {
            const input = { organizationId: "org-123" };
            expect(() => listInvitationsSchema.parse(input)).not.toThrow();
        });

        it("rejects missing organizationId", () => {
            const input = {};
            expect(() => listInvitationsSchema.parse(input)).toThrow();
        });
    });

    describe("cancelInvitationSchema", () => {
        it("accepts valid input", () => {
            const input = { invitationId: "inv-123" };
            expect(() => cancelInvitationSchema.parse(input)).not.toThrow();
        });

        it("rejects missing invitationId", () => {
            const input = {};
            expect(() => cancelInvitationSchema.parse(input)).toThrow();
        });
    });

    describe("acceptInvitationSchema", () => {
        it("accepts valid input", () => {
            const input = { invitationId: "inv-123" };
            expect(() => acceptInvitationSchema.parse(input)).not.toThrow();
        });

        it("rejects missing invitationId", () => {
            const input = {};
            expect(() => acceptInvitationSchema.parse(input)).toThrow();
        });
    });

    describe("leaveOrganizationSchema", () => {
        it("accepts valid input", () => {
            const input = { organizationId: "org-123" };
            expect(() => leaveOrganizationSchema.parse(input)).not.toThrow();
        });

        it("rejects missing organizationId", () => {
            const input = {};
            expect(() => leaveOrganizationSchema.parse(input)).toThrow();
        });
    });
});
