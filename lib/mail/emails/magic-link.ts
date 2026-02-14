import { baseEmailTemplate, buttonHTML } from "@/lib/mail/templates/base";

/**
 * Magic link authentication email
 */
export function magicLinkEmail(verifyUrl: string): { subject: string; html: string } {
    const content = `
<h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b;">
  Sign in to Limt
</h2>

<p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #3f3f46;">
  Click the button below to sign in to your Limt account. This link will expire in 15 minutes.
</p>

${buttonHTML("Sign in to Limt", verifyUrl)}

<p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.5; color: #71717a;">
  If you didn't request this email, you can safely ignore it. The link will expire automatically.
</p>

<p style="margin: 16px 0 0 0; font-size: 12px; line-height: 1.5; color: #a1a1aa; word-break: break-all;">
  Or copy and paste this link into your browser:<br>
  <span style="color: #3b82f6;">${verifyUrl}</span>
</p>
  `.trim();

    return {
        subject: "Sign in to Limt",
        html: baseEmailTemplate({
            title: "Sign in to Limt",
            previewText: "Click to sign in to your Limt account",
            content,
        }),
    };
}
