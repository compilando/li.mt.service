import nodemailer from "nodemailer";

/**
 * Nodemailer SMTP transport configuration
 * Uses environment variables for configuration
 */
export const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
    port: Number(process.env.SMTP_PORT) || 2525,
    auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
    },
});

/**
 * Default sender information
 */
export const fromEmail = {
    name: process.env.SMTP_FROM_NAME || "Limt",
    address: process.env.SMTP_FROM_EMAIL || "noreply@li.mt",
};

/**
 * Verify SMTP connection (for testing/debugging)
 */
export async function verifyConnection(): Promise<boolean> {
    try {
        await transport.verify();
        return true;
    } catch (error) {
        console.error("SMTP connection failed:", error);
        return false;
    }
}
