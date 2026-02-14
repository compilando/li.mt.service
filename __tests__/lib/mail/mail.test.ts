import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendMagicLinkEmail, sendInvitationEmail, sendWelcomeEmail } from "@/lib/mail";
import { transport } from "@/lib/mail/transport";
import { magicLinkEmail } from "@/lib/mail/emails/magic-link";
import { invitationEmail } from "@/lib/mail/emails/invitation";
import { welcomeEmail } from "@/lib/mail/emails/welcome";
import { baseEmailTemplate, buttonHTML } from "@/lib/mail/templates/base";

// Mock nodemailer transport
vi.mock("@/lib/mail/transport", () => ({
    transport: {
        sendMail: vi.fn(),
        verify: vi.fn(),
    },
    fromEmail: {
        name: "Limt",
        address: "noreply@li.mt",
    },
}));

describe("Email System", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock console.log and console.error to avoid noise in tests
        vi.spyOn(console, "log").mockImplementation(() => { });
        vi.spyOn(console, "error").mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("sendMagicLinkEmail", () => {
        it("should send magic link email successfully", async () => {
            vi.mocked(transport.sendMail).mockResolvedValue({} as unknown);

            const result = await sendMagicLinkEmail("test@example.com", "https://example.com/verify");

            expect(result.success).toBe(true);
            expect(transport.sendMail).toHaveBeenCalledTimes(1);
            expect(transport.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: "test@example.com",
                    subject: "Sign in to Limt",
                    from: { name: "Limt", address: "noreply@li.mt" },
                })
            );
        });

        it("should handle email sending failure", async () => {
            vi.mocked(transport.sendMail).mockRejectedValue(new Error("SMTP error"));

            const result = await sendMagicLinkEmail("test@example.com", "https://example.com/verify");

            expect(result.success).toBe(false);
            expect(result.error).toBe("SMTP error");
        });
    });

    describe("sendInvitationEmail", () => {
        it("should send invitation email successfully", async () => {
            vi.mocked(transport.sendMail).mockResolvedValue({} as unknown);

            const result = await sendInvitationEmail({
                to: "newuser@example.com",
                organizationName: "Acme Corp",
                inviterName: "John Doe",
                role: "member",
                invitationUrl: "https://example.com/accept",
            });

            expect(result.success).toBe(true);
            expect(transport.sendMail).toHaveBeenCalledTimes(1);
            expect(transport.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: "newuser@example.com",
                    subject: "You've been invited to join Acme Corp on Limt",
                })
            );
        });

        it("should handle email sending failure", async () => {
            vi.mocked(transport.sendMail).mockRejectedValue(new Error("Network error"));

            const result = await sendInvitationEmail({
                to: "newuser@example.com",
                organizationName: "Acme Corp",
                inviterName: "John Doe",
                role: "admin",
                invitationUrl: "https://example.com/accept",
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe("Network error");
        });
    });

    describe("sendWelcomeEmail", () => {
        it("should send welcome email successfully", async () => {
            vi.mocked(transport.sendMail).mockResolvedValue({} as unknown);

            const result = await sendWelcomeEmail("newuser@example.com", "Jane", "https://example.com/app");

            expect(result.success).toBe(true);
            expect(transport.sendMail).toHaveBeenCalledTimes(1);
            expect(transport.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: "newuser@example.com",
                    subject: "Welcome to Limt! 🚀",
                })
            );
        });

        it("should handle email sending failure", async () => {
            vi.mocked(transport.sendMail).mockRejectedValue(new Error("Connection timeout"));

            const result = await sendWelcomeEmail("newuser@example.com", "Jane", "https://example.com/app");

            expect(result.success).toBe(false);
            expect(result.error).toBe("Connection timeout");
        });
    });

    describe("Email Templates", () => {
        describe("magicLinkEmail", () => {
            it("should generate correct email content", () => {
                const result = magicLinkEmail("https://example.com/verify?token=abc123");

                expect(result.subject).toBe("Sign in to Limt");
                expect(result.html).toContain("Sign in to Limt");
                expect(result.html).toContain("https://example.com/verify?token=abc123");
                expect(result.html).toContain("Click to sign in to your Limt account");
            });
        });

        describe("invitationEmail", () => {
            it("should generate correct email content for member role", () => {
                const result = invitationEmail({
                    organizationName: "Acme Corp",
                    inviterName: "John Doe",
                    role: "member",
                    invitationUrl: "https://example.com/accept",
                });

                expect(result.subject).toBe("You've been invited to join Acme Corp on Limt");
                expect(result.html).toContain("Acme Corp");
                expect(result.html).toContain("John Doe");
                expect(result.html).toContain("Member");
                expect(result.html).toContain("https://example.com/accept");
            });

            it("should generate correct email content for admin role", () => {
                const result = invitationEmail({
                    organizationName: "Test Org",
                    inviterName: "Admin User",
                    role: "admin",
                    invitationUrl: "https://example.com/accept",
                });

                expect(result.subject).toBe("You've been invited to join Test Org on Limt");
                expect(result.html).toContain("Admin");
                expect(result.html).toContain("Manage team members and settings");
            });

            it("should show different permissions for owner role", () => {
                const result = invitationEmail({
                    organizationName: "Test Org",
                    inviterName: "Owner User",
                    role: "owner",
                    invitationUrl: "https://example.com/accept",
                });

                expect(result.html).toContain("Owner");
                expect(result.html).toContain("Configure custom domains");
            });
        });

        describe("welcomeEmail", () => {
            it("should generate correct email content", () => {
                const result = welcomeEmail({
                    userName: "Alice",
                    dashboardUrl: "https://example.com/app",
                });

                expect(result.subject).toBe("Welcome to Limt! 🚀");
                expect(result.html).toContain("Welcome to Limt, Alice!");
                expect(result.html).toContain("https://example.com/app");
                expect(result.html).toContain("Quick Start Guide");
            });

            it("should handle generic user name", () => {
                const result = welcomeEmail({
                    userName: "there",
                    dashboardUrl: "https://example.com/app",
                });

                expect(result.html).toContain("Welcome to Limt, there!");
            });
        });

        describe("baseEmailTemplate", () => {
            it("should generate valid HTML template", () => {
                const html = baseEmailTemplate({
                    title: "Test Email",
                    previewText: "This is a preview",
                    content: "<p>Test content</p>",
                });

                expect(html).toContain("<!DOCTYPE html>");
                expect(html).toContain("Test Email");
                expect(html).toContain("This is a preview");
                expect(html).toContain("<p>Test content</p>");
                expect(html).toContain("Limt");
                expect(html).toContain("Link Management Platform");
            });

            it("should include current year in footer", () => {
                const html = baseEmailTemplate({
                    title: "Test",
                    previewText: "Preview",
                    content: "Content",
                });

                const currentYear = new Date().getFullYear();
                expect(html).toContain(`© ${currentYear} Limt`);
            });
        });

        describe("buttonHTML", () => {
            it("should generate button HTML", () => {
                const html = buttonHTML("Click Me", "https://example.com/action");

                expect(html).toContain("Click Me");
                expect(html).toContain("https://example.com/action");
                expect(html).toContain("<a href");
                expect(html).toContain("background-color: #18181b");
            });
        });
    });

    describe("Email Content Validation", () => {
        it("magic link email should contain security warning", () => {
            const result = magicLinkEmail("https://example.com/verify");
            expect(result.html).toContain("expire");
            expect(result.html).toContain("15 minutes");
        });

        it("invitation email should mention expiration", () => {
            const result = invitationEmail({
                organizationName: "Test",
                inviterName: "User",
                role: "member",
                invitationUrl: "https://example.com",
            });
            expect(result.html).toContain("7 days");
        });

        it("welcome email should include quick start steps", () => {
            const result = welcomeEmail({
                userName: "Test",
                dashboardUrl: "https://example.com",
            });
            expect(result.html).toContain("Create your first short link");
            expect(result.html).toContain("Track your link performance");
            expect(result.html).toContain("Organize with tags");
            expect(result.html).toContain("Invite your team");
        });
    });
});
