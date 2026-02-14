/**
 * Email sending utilities
 * Public API for sending emails via SMTP (Nodemailer)
 */

import { transport, fromEmail } from "@/lib/mail/transport";
import { magicLinkEmail } from "@/lib/mail/emails/magic-link";
import { invitationEmail } from "@/lib/mail/emails/invitation";
import { welcomeEmail } from "@/lib/mail/emails/welcome";

/**
 * Send a magic link authentication email
 */
export async function sendMagicLinkEmail(
    to: string,
    verifyUrl: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { subject, html } = magicLinkEmail(verifyUrl);

        await transport.sendMail({
            from: {
                name: fromEmail.name,
                address: fromEmail.address,
            },
            to,
            subject,
            html,
        });

        console.log(`✅ Magic link email sent to: ${to}`);
        return { success: true };
    } catch (error) {
        console.error("❌ Failed to send magic link email:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Send a team invitation email
 */
export async function sendInvitationEmail(options: {
    to: string;
    organizationName: string;
    inviterName: string;
    role: string;
    invitationUrl: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { subject, html } = invitationEmail({
            organizationName: options.organizationName,
            inviterName: options.inviterName,
            role: options.role,
            invitationUrl: options.invitationUrl,
        });

        await transport.sendMail({
            from: {
                name: fromEmail.name,
                address: fromEmail.address,
            },
            to: options.to,
            subject,
            html,
        });

        console.log(`✅ Invitation email sent to: ${options.to}`);
        return { success: true };
    } catch (error) {
        console.error("❌ Failed to send invitation email:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(
    to: string,
    userName: string,
    dashboardUrl: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { subject, html } = welcomeEmail({
            userName,
            dashboardUrl,
        });

        await transport.sendMail({
            from: {
                name: fromEmail.name,
                address: fromEmail.address,
            },
            to,
            subject,
            html,
        });

        console.log(`✅ Welcome email sent to: ${to}`);
        return { success: true };
    } catch (error) {
        console.error("❌ Failed to send welcome email:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
