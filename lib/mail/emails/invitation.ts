import { baseEmailTemplate, buttonHTML } from "@/lib/mail/templates/base";

/**
 * Team invitation email
 */
export function invitationEmail(options: {
    organizationName: string;
    inviterName: string;
    role: string;
    invitationUrl: string;
}): { subject: string; html: string } {
    const roleText = options.role === "owner" ? "Owner" : options.role === "admin" ? "Admin" : "Member";

    const content = `
<h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b;">
  You've been invited to join ${options.organizationName}
</h2>

<p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #3f3f46;">
  <strong>${options.inviterName}</strong> has invited you to join <strong>${options.organizationName}</strong> on Limt as a <strong>${roleText}</strong>.
</p>

${buttonHTML("Accept Invitation", options.invitationUrl)}

<p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.5; color: #71717a;">
  This invitation will expire in 7 days. If you don't want to join this organization, you can safely ignore this email.
</p>

<div style="margin: 24px 0 0 0; padding: 16px; background-color: #f4f4f5; border-radius: 6px;">
  <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #3f3f46;">
    <strong>What you'll be able to do:</strong>
  </p>
  <ul style="margin: 12px 0 0 0; padding-left: 20px; font-size: 14px; line-height: 1.5; color: #3f3f46;">
    ${options.role === "owner" || options.role === "admin"
            ? `
    <li>Create and manage short links</li>
    <li>View analytics and statistics</li>
    <li>Manage team members and settings</li>
    <li>Configure custom domains</li>
      `.trim()
            : `
    <li>Create and manage short links</li>
    <li>View analytics and statistics</li>
    <li>Collaborate with team members</li>
      `.trim()
        }
  </ul>
</div>

<p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #a1a1aa; word-break: break-all;">
  Or copy and paste this link into your browser:<br>
  <span style="color: #3b82f6;">${options.invitationUrl}</span>
</p>
  `.trim();

    return {
        subject: `You've been invited to join ${options.organizationName} on Limt`,
        html: baseEmailTemplate({
            title: `Join ${options.organizationName} on Limt`,
            previewText: `${options.inviterName} has invited you to join ${options.organizationName}`,
            content,
        }),
    };
}
