import { describe, it, expect } from "vitest";
import {
    normalizeUrl,
    generateRandomColor,
    extractProtocol,
    removeProtocol,
    splitUrl,
    buildUrl,
    isValidUrl,
} from "@/lib/url";

// ─── normalizeUrl ────────────────────────────────────────────────────────────

describe("normalizeUrl", () => {
    it("should add https:// to URLs without protocol", () => {
        expect(normalizeUrl("google.com")).toBe("https://google.com");
        expect(normalizeUrl("example.com/path")).toBe("https://example.com/path");
        expect(normalizeUrl("subdomain.example.com")).toBe("https://subdomain.example.com");
        expect(normalizeUrl("bing.com")).toBe("https://bing.com");
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
        expect(normalizeUrl("ftps://example.com")).toBe("ftps://example.com");
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

// ─── extractProtocol ─────────────────────────────────────────────────────────

describe("extractProtocol", () => {
    it("should extract standard protocols", () => {
        expect(extractProtocol("https://example.com")).toBe("https://");
        expect(extractProtocol("http://example.com")).toBe("http://");
        expect(extractProtocol("ftp://example.com")).toBe("ftp://");
        expect(extractProtocol("ftps://example.com")).toBe("ftps://");
    });

    it("should extract special protocols", () => {
        expect(extractProtocol("mailto:test@example.com")).toBe("mailto:");
        expect(extractProtocol("tel:+1234567890")).toBe("tel:");
    });

    it("should return null for URLs without protocol", () => {
        expect(extractProtocol("example.com")).toBeNull();
        expect(extractProtocol("google.com/path")).toBeNull();
    });

    it("should handle whitespace", () => {
        expect(extractProtocol("  https://example.com  ")).toBe("https://");
        expect(extractProtocol("  example.com  ")).toBeNull();
    });

    it("should return null for empty strings", () => {
        expect(extractProtocol("")).toBeNull();
        expect(extractProtocol("   ")).toBeNull();
    });
});

// ─── removeProtocol ──────────────────────────────────────────────────────────

describe("removeProtocol", () => {
    it("should remove standard protocols", () => {
        expect(removeProtocol("https://example.com")).toBe("example.com");
        expect(removeProtocol("http://google.com/path")).toBe("google.com/path");
        expect(removeProtocol("ftp://ftp.example.com")).toBe("ftp.example.com");
    });

    it("should remove special protocols", () => {
        expect(removeProtocol("mailto:test@example.com")).toBe("test@example.com");
        expect(removeProtocol("tel:+1234567890")).toBe("+1234567890");
    });

    it("should return unchanged URLs without protocol", () => {
        expect(removeProtocol("example.com")).toBe("example.com");
        expect(removeProtocol("google.com/path")).toBe("google.com/path");
    });

    it("should handle whitespace", () => {
        expect(removeProtocol("  https://example.com  ")).toBe("example.com");
    });
});

// ─── splitUrl ────────────────────────────────────────────────────────────────

describe("splitUrl", () => {
    it("should split URLs with protocols", () => {
        expect(splitUrl("https://example.com")).toEqual({
            protocol: "https://",
            path: "example.com",
        });
        expect(splitUrl("http://google.com/path")).toEqual({
            protocol: "http://",
            path: "google.com/path",
        });
        expect(splitUrl("ftp://ftp.example.com")).toEqual({
            protocol: "ftp://",
            path: "ftp.example.com",
        });
    });

    it("should default to https:// for URLs without protocol", () => {
        expect(splitUrl("example.com")).toEqual({
            protocol: "https://",
            path: "example.com",
        });
        expect(splitUrl("google.com/path")).toEqual({
            protocol: "https://",
            path: "google.com/path",
        });
        expect(splitUrl("bing.com")).toEqual({
            protocol: "https://",
            path: "bing.com",
        });
    });

    it("should handle complex URLs", () => {
        expect(splitUrl("https://example.com:8080/path?query=value#hash")).toEqual({
            protocol: "https://",
            path: "example.com:8080/path?query=value#hash",
        });
    });

    it("should handle whitespace", () => {
        expect(splitUrl("  https://example.com  ")).toEqual({
            protocol: "https://",
            path: "example.com",
        });
    });
});

// ─── buildUrl ────────────────────────────────────────────────────────────────

describe("buildUrl", () => {
    it("should build URLs from protocol and path", () => {
        expect(buildUrl("https://", "example.com")).toBe("https://example.com");
        expect(buildUrl("http://", "google.com/path")).toBe("http://google.com/path");
        expect(buildUrl("ftp://", "ftp.example.com")).toBe("ftp://ftp.example.com");
    });

    it("should return empty string for empty path", () => {
        expect(buildUrl("https://", "")).toBe("");
        expect(buildUrl("http://", "   ")).toBe("");
    });

    it("should use existing protocol if path has one", () => {
        expect(buildUrl("http://", "https://example.com")).toBe("https://example.com");
        expect(buildUrl("https://", "ftp://ftp.example.com")).toBe("ftp://ftp.example.com");
    });

    it("should handle complex paths", () => {
        expect(buildUrl("https://", "example.com:8080/path?query=value#hash")).toBe(
            "https://example.com:8080/path?query=value#hash"
        );
    });

    it("should trim whitespace from path", () => {
        expect(buildUrl("https://", "  example.com  ")).toBe("https://example.com");
    });
});

// ─── isValidUrl ──────────────────────────────────────────────────────────────

describe("isValidUrl", () => {
    it("should return true for valid URLs", () => {
        expect(isValidUrl("https://example.com")).toBe(true);
        expect(isValidUrl("http://google.com")).toBe(true);
        expect(isValidUrl("example.com")).toBe(true); // Normalized to https://
        expect(isValidUrl("bing.com")).toBe(true);
        expect(isValidUrl("ftp://ftp.example.com")).toBe(true);
    });

    it("should return true for URLs with paths", () => {
        expect(isValidUrl("example.com/path")).toBe(true);
        expect(isValidUrl("https://example.com/path?query=value")).toBe(true);
    });

    it("should return false for invalid URLs", () => {
        expect(isValidUrl("not a url")).toBe(false);
        expect(isValidUrl("just words")).toBe(false);
        expect(isValidUrl("://invalid")).toBe(false);
    });

    it("should return false for empty strings", () => {
        expect(isValidUrl("")).toBe(false);
    });
});

// ─── generateRandomColor ─────────────────────────────────────────────────────

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
