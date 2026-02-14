/**
 * Base HTML email template
 * Provides consistent branding and styling for all emails
 */
export function baseEmailTemplate(options: {
    title: string;
    previewText: string;
    content: string;
}): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${options.title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Preview text (hidden in email clients) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${options.previewText}
  </div>
  
  <!-- Email container -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Content card -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 30px 40px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #18181b; letter-spacing: -0.02em;">
                Limt
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a;">
                Link Management Platform
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              ${options.content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px 40px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">
                © ${new Date().getFullYear()} Limt · Link Management Platform
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                You received this email because you signed up for Limt.
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Helper to create a primary button
 */
export function buttonHTML(text: string, url: string): string {
    return `
<table border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 20px 0;">
      <a href="${url}" style="display: inline-block; padding: 14px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
        ${text}
      </a>
    </td>
  </tr>
</table>
  `.trim();
}
