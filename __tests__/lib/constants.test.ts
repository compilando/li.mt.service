import { describe, it, expect } from "vitest";
import {
    APP_NAME,
    APP_DESCRIPTION,
    APP_URL,
    SHORT_CODE_LENGTH,
    SHORT_CODE_ALPHABET,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    RESERVED_SHORT_CODES,
} from "@/lib/constants";
import { PLANS } from "@/lib/plans";

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
        expect(PLANS).toHaveProperty("free");
        expect(PLANS).toHaveProperty("pro");
        expect(PLANS).toHaveProperty("business");
    });

    it("free plan has restrictive limits", () => {
        expect(PLANS.free.limits.links).toBeGreaterThan(0);
        expect(PLANS.free.limits.links).toBeLessThanOrEqual(100);
        expect(PLANS.free.limits.domains).toBe(0);
    });

    it("pro plan has higher limits than free", () => {
        expect(PLANS.pro.limits.links).toBeGreaterThan(PLANS.free.limits.links);
        expect(PLANS.pro.limits.clicksPerMonth).toBeGreaterThan(PLANS.free.limits.clicksPerMonth);
        expect(PLANS.pro.limits.domains).toBeGreaterThan(PLANS.free.limits.domains);
    });

    it("business plan has unlimited (-1) or very high limits", () => {
        expect(PLANS.business.limits.links).toBe(-1);
        expect(PLANS.business.limits.clicksPerMonth).toBeGreaterThanOrEqual(100000);
        expect(PLANS.business.limits.tags).toBe(-1);
    });

    it("all plans have required limit fields", () => {
        const requiredFields = ["links", "clicksPerMonth", "domains", "apiKeys", "tags"];
        for (const plan of Object.values(PLANS)) {
            for (const field of requiredFields) {
                expect(plan.limits).toHaveProperty(field);
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
