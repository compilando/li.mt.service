import { describe, it, expect } from "vitest";
import {
    APP_NAME,
    APP_DESCRIPTION,
    APP_URL,
    SHORT_CODE_LENGTH,
    SHORT_CODE_ALPHABET,
    PLAN_LIMITS,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
} from "@/lib/constants";

describe("App Constants", () => {
    it("has correct app name", () => {
        expect(APP_NAME).toBe("Limt");
    });

    it("has an app description", () => {
        expect(APP_DESCRIPTION).toBeTruthy();
        expect(typeof APP_DESCRIPTION).toBe("string");
    });

    it("has a valid app URL", () => {
        expect(APP_URL).toBeTruthy();
        expect(APP_URL).toMatch(/^https?:\/\//);
    });
});

describe("Short Code Configuration", () => {
    it("has a reasonable default length", () => {
        expect(SHORT_CODE_LENGTH).toBeGreaterThanOrEqual(5);
        expect(SHORT_CODE_LENGTH).toBeLessThanOrEqual(20);
    });

    it("has an alphanumeric alphabet", () => {
        expect(SHORT_CODE_ALPHABET).toMatch(/[a-z]/);
        expect(SHORT_CODE_ALPHABET).toMatch(/[A-Z]/);
        expect(SHORT_CODE_ALPHABET).toMatch(/[0-9]/);
    });

    it("does not contain ambiguous characters for readability", () => {
        // Alphabet should only contain URL-safe characters
        expect(SHORT_CODE_ALPHABET).not.toMatch(/[^a-zA-Z0-9]/);
    });
});

describe("Plan Limits", () => {
    it("has free, pro, and business plans", () => {
        expect(PLAN_LIMITS).toHaveProperty("free");
        expect(PLAN_LIMITS).toHaveProperty("pro");
        expect(PLAN_LIMITS).toHaveProperty("business");
    });

    it("free plan has restrictive limits", () => {
        expect(PLAN_LIMITS.free.linksPerMonth).toBeGreaterThan(0);
        expect(PLAN_LIMITS.free.linksPerMonth).toBeLessThanOrEqual(100);
        expect(PLAN_LIMITS.free.domains).toBe(0);
    });

    it("pro plan has higher limits than free", () => {
        expect(PLAN_LIMITS.pro.linksPerMonth).toBeGreaterThan(PLAN_LIMITS.free.linksPerMonth);
        expect(PLAN_LIMITS.pro.clicksPerMonth).toBeGreaterThan(PLAN_LIMITS.free.clicksPerMonth);
        expect(PLAN_LIMITS.pro.domains).toBeGreaterThan(PLAN_LIMITS.free.domains);
    });

    it("business plan has unlimited (-1) or very high limits", () => {
        expect(PLAN_LIMITS.business.linksPerMonth).toBe(-1);
        expect(PLAN_LIMITS.business.clicksPerMonth).toBe(-1);
        expect(PLAN_LIMITS.business.domains).toBe(-1);
    });

    it("all plans have required limit fields", () => {
        const requiredFields = ["linksPerMonth", "clicksPerMonth", "domains", "apiKeys", "tags"];
        for (const plan of Object.values(PLAN_LIMITS)) {
            for (const field of requiredFields) {
                expect(plan).toHaveProperty(field);
            }
        }
    });
});

describe("Pagination Constants", () => {
    it("has reasonable default page size", () => {
        expect(DEFAULT_PAGE_SIZE).toBeGreaterThanOrEqual(10);
        expect(DEFAULT_PAGE_SIZE).toBeLessThanOrEqual(50);
    });

    it("has a max page size limit", () => {
        expect(MAX_PAGE_SIZE).toBeGreaterThan(DEFAULT_PAGE_SIZE);
        expect(MAX_PAGE_SIZE).toBeLessThanOrEqual(1000);
    });
});
