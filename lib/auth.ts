import { betterAuth, User } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { magicLink, organization } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import { createPersonalOrganization } from "@/lib/organization/utils";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [
    magicLink({
      async sendMagicLink(data) {
        console.log(data);
      },
    }),
    nextCookies(),
    organization(),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await createPersonalOrganization({
            userId: user.id,
          });
        },
      },
    },
  },
});
