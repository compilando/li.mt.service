import { betterAuth, User } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { magicLink, organization } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import { createPersonalOrganization } from "@/lib/organization/utils";
import { sendMagicLinkEmail, sendWelcomeEmail } from "@/lib/mail";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      enabled: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      enabled: !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [
    magicLink({
      async sendMagicLink(data, request) {
        // Extract callback URL from the magic link data
        const callbackURL = data.url.includes("callbackURL=")
          ? decodeURIComponent(data.url.split("callbackURL=")[1].split("&")[0])
          : "/app";

        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-magic-link?token=${data.token}&callbackURL=${encodeURIComponent(callbackURL)}`;

        console.log("\n🔐 Magic Link Generated:");
        console.log("📧 Email:", data.email);
        console.log("🔗 Verify URL:", verifyUrl);
        console.log("\n");

        // In development, store the link so it appears in the dev page
        if (process.env.NODE_ENV === "development") {
          try {
            await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/dev/magic-links`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: data.email, url: verifyUrl }),
              }
            );
          } catch (error) {
            console.error("Failed to store magic link for dev page:", error);
          }
        }

        // Send magic link email
        await sendMagicLinkEmail(data.email, verifyUrl);
      },
      disableSignUp: false,
    }),
    nextCookies(),
    organization(),
  ],
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await createPersonalOrganization({
            userId: user.id,
          });

          // Send welcome email
          const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app`;
          await sendWelcomeEmail(
            user.email,
            user.name || "there",
            dashboardUrl
          );
        },
      },
    },
  },
});
