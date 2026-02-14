import prisma from "../lib/prisma";
import { nanoid } from "nanoid";

const systemAliases = [
    // OS
    { name: "Windows", category: "os", variable: "device.os", operator: "equals", value: "Windows", icon: "🪟" },
    { name: "Mac", category: "os", variable: "device.os", operator: "equals", value: "macOS", icon: "🍎" },
    { name: "Linux", category: "os", variable: "device.os", operator: "equals", value: "Linux", icon: "🐧" },
    { name: "iOS", category: "os", variable: "device.os", operator: "equals", value: "iOS", icon: "📱" },
    { name: "Android", category: "os", variable: "device.os", operator: "equals", value: "Android", icon: "🤖" },

    // Device
    { name: "Mobile", category: "device", variable: "device.type", operator: "equals", value: "mobile", icon: "📱" },
    { name: "Desktop", category: "device", variable: "device.type", operator: "equals", value: "desktop", icon: "🖥️" },
    { name: "Tablet", category: "device", variable: "device.type", operator: "equals", value: "tablet", icon: "📱" },

    // Browser
    { name: "Chrome", category: "browser", variable: "device.browser", operator: "equals", value: "Chrome", icon: "🌐" },
    { name: "Firefox", category: "browser", variable: "device.browser", operator: "equals", value: "Firefox", icon: "🦊" },
    { name: "Safari", category: "browser", variable: "device.browser", operator: "equals", value: "Safari", icon: "🧭" },
    { name: "Edge", category: "browser", variable: "device.browser", operator: "equals", value: "Edge", icon: "🌐" },

    // Countries
    { name: "Spain", category: "country", variable: "geo.country", operator: "equals", value: "ES", icon: "🇪🇸" },
    { name: "USA", category: "country", variable: "geo.country", operator: "equals", value: "US", icon: "🇺🇸" },
    { name: "Mexico", category: "country", variable: "geo.country", operator: "equals", value: "MX", icon: "🇲🇽" },
    { name: "UK", category: "country", variable: "geo.country", operator: "equals", value: "GB", icon: "🇬🇧" },
    { name: "France", category: "country", variable: "geo.country", operator: "equals", value: "FR", icon: "🇫🇷" },
    { name: "Germany", category: "country", variable: "geo.country", operator: "equals", value: "DE", icon: "🇩🇪" },

    // Time
    { name: "Morning", category: "time", variable: "time.hour", operator: "between", value: "6-11", icon: "🌅" },
    { name: "Afternoon", category: "time", variable: "time.hour", operator: "between", value: "12-17", icon: "☀️" },
    { name: "Evening", category: "time", variable: "time.hour", operator: "between", value: "18-21", icon: "🌆" },
    { name: "Night", category: "time", variable: "time.hour", operator: "between", value: "22-5", icon: "🌙" },
    { name: "Weekday", category: "time", variable: "time.day", operator: "in", value: "1,2,3,4,5", icon: "📅" },
    { name: "Weekend", category: "time", variable: "time.day", operator: "in", value: "6,7", icon: "🎉" },

    // Language
    { name: "Spanish", category: "language", variable: "http.language", operator: "equals", value: "es", icon: "🇪🇸" },
    { name: "English", category: "language", variable: "http.language", operator: "equals", value: "en", icon: "🇬🇧" },
];

async function seedSystemAliases() {
    console.log("🌱 Seeding system aliases...");

    for (const alias of systemAliases) {
        await prisma.conditionAlias.upsert({
            where: {
                name_isSystem: {
                    name: alias.name,
                    isSystem: true,
                },
            },
            update: {},
            create: {
                id: nanoid(),
                ...alias,
                organizationId: null,
                isSystem: true,
            },
        });
    }

    console.log(`✅ Created ${systemAliases.length} system aliases`);
}

async function main() {
    try {
        await seedSystemAliases();
        console.log("🎉 Routing system setup complete!");
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
