import { describe, it, expect } from "vitest";
import { generateShortCode, isReservedShortCode, RESERVED_SHORT_CODES } from "@/lib/short-code";
import { SHORT_CODE_LENGTH, SHORT_CODE_ALPHABET } from "@/lib/constants";

describe("generateShortCode", () => {
    it("generates a code with the default length", () => {
        const code = generateShortCode();
        expect(code).toHaveLength(SHORT_CODE_LENGTH);
    });

    it("generates a code with a custom length", () => {
        const code = generateShortCode(12);
        expect(code).toHaveLength(12);
    });

    it("only contains valid alphabet characters", () => {
        const validChars = new Set(SHORT_CODE_ALPHABET.split(""));
        for (let i = 0; i < 100; i++) {
            const code = generateShortCode();
            for (const char of code) {
                expect(validChars.has(char)).toBe(true);
            }
        }
    });

    it("generates unique codes (probabilistic)", () => {
        const codes = new Set<string>();
        for (let i = 0; i < 1000; i++) {
            codes.add(generateShortCode());
        }
        // With 62^7 possible codes, 1000 should all be unique
        expect(codes.size).toBe(1000);
    });
});

describe("isReservedShortCode", () => {
    it("returns true for reserved codes", () => {
        expect(isReservedShortCode("app")).toBe(true);
        expect(isReservedShortCode("api")).toBe(true);
        expect(isReservedShortCode("signin")).toBe(true);
        expect(isReservedShortCode("admin")).toBe(true);
        expect(isReservedShortCode("dashboard")).toBe(true);
    });

    it("is case-insensitive", () => {
        expect(isReservedShortCode("APP")).toBe(true);
        expect(isReservedShortCode("Api")).toBe(true);
        expect(isReservedShortCode("SIGNIN")).toBe(true);
    });

    it("returns false for non-reserved codes", () => {
        expect(isReservedShortCode("abc1234")).toBe(false);
        expect(isReservedShortCode("mylink")).toBe(false);
        expect(isReservedShortCode("xyz")).toBe(false);
    });

    it("returns false for empty string", () => {
        expect(isReservedShortCode("")).toBe(false);
    });
});

describe("RESERVED_SHORT_CODES", () => {
    it("is a Set", () => {
        expect(RESERVED_SHORT_CODES).toBeInstanceOf(Set);
    });

    it("contains critical route paths", () => {
        const critical = ["app", "api", "signin", "signup", "signout", "auth", "admin"];
        for (const code of critical) {
            expect(RESERVED_SHORT_CODES.has(code)).toBe(true);
        }
    });

    it("has a reasonable number of reserved codes", () => {
        expect(RESERVED_SHORT_CODES.size).toBeGreaterThan(10);
        expect(RESERVED_SHORT_CODES.size).toBeLessThan(100);
    });
});
