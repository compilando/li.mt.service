import { baseEmailTemplate, buttonHTML } from "@/lib/mail/templates/base";

/**
 * Welcome email for new users
 */
export function welcomeEmail(options: {
    userName: string;
    dashboardUrl: string;
}): { subject: string; html: string } {
    const content = `
<h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b;">
  Welcome to Limt, ${options.userName}! 👋
</h2>

<p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #3f3f46;">
  We're excited to have you on board! Limt is your all-in-one link management platform for creating, tracking, and optimizing short links.
</p>

${buttonHTML("Go to Dashboard", options.dashboardUrl)}

<div style="margin: 32px 0 0 0;">
  <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #18181b;">
    Quick Start Guide
  </h3>
  
  <div style="margin: 0 0 16px 0; padding: 16px; background-color: #f4f4f5; border-radius: 6px; border-left: 3px solid #18181b;">
    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #18181b;">
      1️⃣ Create your first short link
    </p>
    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #3f3f46;">
      Click "Create Link" in your dashboard and paste any URL. You can customize the short code, add UTM parameters, and more.
    </p>
  </div>
  
  <div style="margin: 0 0 16px 0; padding: 16px; background-color: #f4f4f5; border-radius: 6px; border-left: 3px solid #18181b;">
    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #18181b;">
      2️⃣ Track your link performance
    </p>
    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #3f3f46;">
      View real-time analytics including clicks, geographic data, device types, and referral sources.
    </p>
  </div>
  
  <div style="margin: 0 0 16px 0; padding: 16px; background-color: #f4f4f5; border-radius: 6px; border-left: 3px solid #18181b;">
    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #18181b;">
      3️⃣ Organize with tags
    </p>
    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #3f3f46;">
      Use tags to categorize your links by campaign, channel, or any system that works for you.
    </p>
  </div>
  
  <div style="margin: 0; padding: 16px; background-color: #f4f4f5; border-radius: 6px; border-left: 3px solid #18181b;">
    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #18181b;">
      4️⃣ Invite your team
    </p>
    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #3f3f46;">
      Create organizations and invite team members to collaborate on link management together.
    </p>
  </div>
</div>

<div style="margin: 32px 0 0 0; padding: 16px; background-color: #eff6ff; border-radius: 6px;">
  <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #1e40af;">
    💡 <strong>Pro Tip:</strong> You can also use custom domains, password-protect links, set expiration dates, and add custom QR codes.
  </p>
</div>

<p style="margin: 32px 0 0 0; font-size: 14px; line-height: 1.5; color: #71717a;">
  If you have any questions or need help getting started, we're here to help!
</p>

<p style="margin: 16px 0 0 0; font-size: 14px; line-height: 1.5; color: #71717a;">
  Happy link shortening! 🚀<br>
  The Limt Team
</p>
  `.trim();

    return {
        subject: "Welcome to Limt! 🚀",
        html: baseEmailTemplate({
            title: "Welcome to Limt",
            previewText: "Get started with your link management platform",
            content,
        }),
    };
}
