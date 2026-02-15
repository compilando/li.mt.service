import prisma from "../lib/prisma";
import { randomBytes } from "crypto";

async function main() {
    console.log("🌐 Seeding domains...");

    // Get the first organization (assuming it exists from previous seeds)
    const org = await prisma.organization.findFirst();
    
    if (!org) {
        console.error("❌ No organization found. Please run the main seed first.");
        return;
    }

    console.log(`📦 Using organization: ${org.name} (${org.id})`);

    // Default/Branded domains (pre-verified, platform-provided)
    const defaultDomains = [
        {
            name: "dub.sh",
            description: "The default domain for all new accounts",
            logo: "https://avatars.githubusercontent.com/u/63084184",
            type: "default",
            verified: true,
        },
        {
            name: "dub.link",
            description: "Premium short domain on Dub – only available on our Pro plan and above",
            logo: "https://avatars.githubusercontent.com/u/63084184",
            type: "default",
            verified: true,
        },
        {
            name: "chatg.pt",
            description: "Branded domain for ChatGPT links (convos, custom GPTs)",
            logo: "https://cdn.oaistatic.com/_next/static/media/apple-touch-icon.59f2e898.png",
            type: "default",
            verified: true,
        },
        {
            name: "spti.fi",
            description: "Branded domain for Spotify links (songs, playlists, etc.)",
            logo: "https://www.scdn.co/i/_global/twitter_card-default.jpg",
            type: "default",
            verified: true,
        },
        {
            name: "git.new",
            description: "Branded domain for GitHub links (repositories, gists, etc.)",
            logo: "https://github.githubassets.com/favicons/favicon.png",
            type: "default",
            verified: true,
        },
        {
            name: "amzn.id",
            description: "Branded domain for Amazon links (products, wishlists, etc.)",
            logo: "https://www.amazon.com/favicon.ico",
            type: "default",
            verified: true,
        },
        {
            name: "ggl.link",
            description: "Branded domain for Google links (Search, Docs, Sheets, Slides, Drive, Maps, etc.)",
            logo: "https://www.google.com/favicon.ico",
            type: "default",
            verified: true,
        },
        {
            name: "cal.link",
            description: "Branded domain for your scheduling links (Cal.com, Calendly, etc.)",
            logo: "https://cal.com/favicon.ico",
            type: "default",
            verified: true,
        },
    ];

    // Custom domains (some verified, some pending)
    const customDomains = [
        {
            name: "go.acme.com",
            description: "ACME Corp custom domain",
            type: "custom",
            verified: true,
            verificationToken: randomBytes(32).toString("hex"),
            lastCheckedAt: new Date(),
            notFoundUrl: "https://acme.com/404",
            expiredUrl: "https://acme.com/expired",
        },
        {
            name: "links.startup.io",
            description: "Startup.io marketing links",
            type: "custom",
            verified: true,
            verificationToken: randomBytes(32).toString("hex"),
            lastCheckedAt: new Date(),
        },
        {
            name: "try.example.com",
            description: "Example Corp demo domain",
            type: "custom",
            verified: false,
            verificationToken: randomBytes(32).toString("hex"),
        },
    ];

    // Insert default domains
    console.log("\n📝 Creating default/branded domains...");
    for (const domain of defaultDomains) {
        const created = await prisma.domain.upsert({
            where: { name: domain.name },
            update: {},
            create: {
                ...domain,
                organizationId: org.id,
            },
        });
        console.log(`  ✅ ${created.name} (${created.type})`);
    }

    // Insert custom domains
    console.log("\n📝 Creating custom domains...");
    for (const domain of customDomains) {
        const created = await prisma.domain.upsert({
            where: { name: domain.name },
            update: {},
            create: {
                ...domain,
                organizationId: org.id,
            },
        });
        const status = created.verified ? "✅ verified" : "⏳ pending verification";
        console.log(`  ${status} ${created.name}`);
    }

    console.log("\n✅ Domain seeding completed!");
    console.log(`   - ${defaultDomains.length} default/branded domains`);
    console.log(`   - ${customDomains.length} custom domains`);
}

main()
    .catch((e) => {
        console.error("❌ Error seeding domains:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
