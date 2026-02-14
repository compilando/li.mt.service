import { describe, it, expect } from "vitest";
import { normalizeUrl, generateRandomColor } from "@/lib/url";

describe("normalizeUrl", () => {
    it("should add https:// to URLs without protocol", () => {
        expect(normalizeUrl("google.com")).toBe("https://google.com");
        expect(normalizeUrl("example.com/path")).toBe("https://example.com/path");
        expect(normalizeUrl("subdomain.example.com")).toBe("https://subdomain.example.com");
    });

    it("should preserve URLs that already have https://", () => {
        expect(normalizeUrl("https://google.com")).toBe("https://google.com");
        expect(normalizeUrl("https://example.com/path")).toBe("https://example.com/path");
    });

    it("should preserve URLs that already have http://", () => {
        expect(normalizeUrl("http://google.com")).toBe("http://google.com");
        expect(normalizeUrl("http://example.com/path")).toBe("http://example.com/path");
    });

    it("should preserve other protocols", () => {
        expect(normalizeUrl("ftp://example.com")).toBe("ftp://example.com");
        expect(normalizeUrl("mailto:test@example.com")).toBe("mailto:test@example.com");
        expect(normalizeUrl("tel:+1234567890")).toBe("tel:+1234567890");
    });

    it("should handle URLs with query parameters", () => {
        expect(normalizeUrl("example.com?foo=bar")).toBe("https://example.com?foo=bar");
        expect(normalizeUrl("https://example.com?foo=bar")).toBe("https://example.com?foo=bar");
    });

    it("should handle URLs with hash fragments", () => {
        expect(normalizeUrl("example.com#section")).toBe("https://example.com#section");
        expect(normalizeUrl("https://example.com#section")).toBe("https://example.com#section");
    });

    it("should trim whitespace", () => {
        expect(normalizeUrl("  google.com  ")).toBe("https://google.com");
        expect(normalizeUrl("  https://google.com  ")).toBe("https://google.com");
    });

    it("should handle empty strings", () => {
        expect(normalizeUrl("")).toBe("");
        expect(normalizeUrl("   ")).toBe("https://");
    });

    it("should handle complex URLs", () => {
        expect(normalizeUrl("example.com:8080/path?query=value#hash")).toBe(
            "https://example.com:8080/path?query=value#hash"
        );
    });
});

describe("generateRandomColor", () => {
    it("should return a valid hex color", () => {
        const color = generateRandomColor();
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("should return one of the predefined colors", () => {
        const validColors = [
            "#3B82F6", // blue
            "#8B5CF6", // violet
            "#EC4899", // pink
            "#F59E0B", // amber
            "#10B981", // emerald
            "#6366F1", // indigo
            "#F97316", // orange
            "#14B8A6", // teal
            "#EF4444", // red
            "#84CC16", // lime
        ];

        const color = generateRandomColor();
        expect(validColors).toContain(color);
    });

    it("should generate colors (non-deterministic test)", () => {
        // Generate multiple colors and ensure they're all valid
        const colors = new Set<string>();
        for (let i = 0; i < 50; i++) {
            colors.add(generateRandomColor());
        }

        // All generated colors should be valid
        colors.forEach((color) => {
            expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });

        // With 50 attempts, we should get at least 2 different colors (very high probability)
        expect(colors.size).toBeGreaterThanOrEqual(2);
    });
});
