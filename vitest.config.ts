import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./__tests__/setup.ts"],
        include: ["__tests__/**/*.test.{ts,tsx}"],
        exclude: ["node_modules", ".next", "generated"],
        coverage: {
            provider: "v8",
            reporter: ["text", "text-summary", "lcov", "html"],
            include: ["lib/**/*.ts", "lib/**/*.tsx"],
            exclude: [
                "lib/auth.ts",
                "lib/auth-client.ts",
                "lib/prisma.ts",
                "node_modules",
                "generated",
            ],
            thresholds: {
                statements: 80,
                branches: 75,
                functions: 80,
                lines: 80,
            },
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./"),
        },
    },
});
