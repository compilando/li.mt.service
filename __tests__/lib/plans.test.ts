import { describe, it, expect } from "vitest";
import { PlanGuard, PLANS, getAllPlans, getPlanConfig, isValidPlanId, getUpgradePlan } from "@/lib/plans";
import type { ResourceUsage } from "@/lib/plans";

describe("Plan Configuration", () => {
    it("should have correct plan structure", () => {
        expect(PLANS.free).toBeDefined();
        expect(PLANS.pro).toBeDefined();
        expect(PLANS.business).toBeDefined();
    });

    it("should have correct free plan limits", () => {
        expect(PLANS.free.limits.links).toBe(25);
        expect(PLANS.free.limits.tags).toBe(5);
        expect(PLANS.free.limits.domains).toBe(0);
        expect(PLANS.free.price).toBe(0);
    });

    it("should have correct pro plan limits", () => {
        expect(PLANS.pro.limits.links).toBe(1000);
        expect(PLANS.pro.limits.tags).toBe(25);
        expect(PLANS.pro.limits.domains).toBe(5);
        expect(PLANS.pro.price).toBe(30);
        expect(PLANS.pro.recommended).toBe(true);
    });

    it("should have correct business plan limits", () => {
        expect(PLANS.business.limits.links).toBe(-1); // unlimited
        expect(PLANS.business.limits.tags).toBe(-1); // unlimited
        expect(PLANS.business.limits.domains).toBe(25);
        expect(PLANS.business.price).toBe(90);
    });
});

describe("PlanGuard", () => {
    const mockUsage: ResourceUsage = {
        links: 10,
        tags: 3,
        domains: 1,
        apiKeys: 0,
        members: 1,
        clicksPerMonth: 500,
    };

    describe("Limit Checks", () => {
        it("should correctly calculate remaining quota for free plan", () => {
            const guard = new PlanGuard("free", mockUsage);
            
            expect(guard.getRemaining("links")).toBe(15); // 25 - 10
            expect(guard.getRemaining("tags")).toBe(2); // 5 - 3
        });

        it("should return -1 for unlimited resources", () => {
            const guard = new PlanGuard("business", mockUsage);
            
            expect(guard.getRemaining("links")).toBe(-1);
            expect(guard.getRemaining("tags")).toBe(-1);
            expect(guard.isUnlimited("links")).toBe(true);
            expect(guard.isUnlimited("tags")).toBe(true);
        });

        it("should correctly check if can create resources", () => {
            const guard = new PlanGuard("free", mockUsage);
            
            expect(guard.canCreate("links", 1)).toBe(true); // 10 + 1 <= 25
            expect(guard.canCreate("links", 15)).toBe(true); // 10 + 15 = 25
            expect(guard.canCreate("links", 16)).toBe(false); // 10 + 16 > 25
            expect(guard.canCreate("tags", 3)).toBe(false); // 3 + 3 > 5
        });

        it("should always allow creation for unlimited resources", () => {
            const guard = new PlanGuard("business", mockUsage);
            
            expect(guard.canCreate("links", 1000000)).toBe(true);
            expect(guard.canCreate("tags", 999999)).toBe(true);
        });

        it("should calculate usage percentage correctly", () => {
            const guard = new PlanGuard("free", mockUsage);
            
            expect(guard.getUsagePercentage("links")).toBe(40); // 10/25 * 100
            expect(guard.getUsagePercentage("tags")).toBe(60); // 3/5 * 100
        });

        it("should return -1 for unlimited resources percentage", () => {
            const guard = new PlanGuard("business", mockUsage);
            
            expect(guard.getUsagePercentage("links")).toBe(-1);
            expect(guard.getUsagePercentage("tags")).toBe(-1);
        });
    });

    describe("Feature Checks", () => {
        it("free plan should have no features", () => {
            const guard = new PlanGuard("free", mockUsage);
            
            expect(guard.hasFeature("utm")).toBe(false);
            expect(guard.hasFeature("apiAccess")).toBe(false);
            expect(guard.listFeatures()).toHaveLength(0);
        });

        it("pro plan should have correct features", () => {
            const guard = new PlanGuard("pro", mockUsage);
            
            expect(guard.hasFeature("utm")).toBe(true);
            expect(guard.hasFeature("apiAccess")).toBe(true);
            expect(guard.hasFeature("smartRouting")).toBe(true);
            expect(guard.hasFeature("abTesting")).toBe(false); // business only
            expect(guard.hasFeature("roleBasedAccess")).toBe(false); // business only
        });

        it("business plan should have all features", () => {
            const guard = new PlanGuard("business", mockUsage);
            
            expect(guard.hasFeature("utm")).toBe(true);
            expect(guard.hasFeature("apiAccess")).toBe(true);
            expect(guard.hasFeature("abTesting")).toBe(true);
            expect(guard.hasFeature("roleBasedAccess")).toBe(true);
            expect(guard.hasFeature("prioritySupport")).toBe(true);
        });
    });

    describe("Plan Info", () => {
        it("should return correct plan information", () => {
            const guard = new PlanGuard("pro", mockUsage);
            
            expect(guard.getPlanId()).toBe("pro");
            expect(guard.getPlanName()).toBe("Pro");
            expect(guard.getPrice()).toBe(30);
            expect(guard.getYearlyPrice()).toBe(288);
            expect(guard.isPaid()).toBe(true);
        });

        it("should identify free plan correctly", () => {
            const guard = new PlanGuard("free", mockUsage);
            
            expect(guard.isPaid()).toBe(false);
            expect(guard.getPrice()).toBe(0);
        });

        it("should return correct upgrade plan", () => {
            const freeGuard = new PlanGuard("free", mockUsage);
            const proGuard = new PlanGuard("pro", mockUsage);
            const businessGuard = new PlanGuard("business", mockUsage);
            
            expect(freeGuard.getUpgradePlan()?.id).toBe("pro");
            expect(proGuard.getUpgradePlan()?.id).toBe("business");
            expect(businessGuard.getUpgradePlan()).toBeNull();
        });
    });

    describe("Serialization", () => {
        it("should serialize and deserialize correctly", () => {
            const guard = new PlanGuard("pro", mockUsage);
            const json = guard.toJSON();
            
            expect(json.planId).toBe("pro");
            expect(json.planName).toBe("Pro");
            expect(json.usage).toEqual(mockUsage);
            
            const newGuard = PlanGuard.fromJSON(json);
            expect(newGuard.getPlanId()).toBe("pro");
            expect(newGuard.getUsage("links")).toBe(10);
        });
    });
});

describe("Helper Functions", () => {
    it("getAllPlans should return all plans in order", () => {
        const plans = getAllPlans();
        
        expect(plans).toHaveLength(3);
        expect(plans[0].id).toBe("free");
        expect(plans[1].id).toBe("pro");
        expect(plans[2].id).toBe("business");
    });

    it("getPlanConfig should return correct plan", () => {
        const plan = getPlanConfig("pro");
        
        expect(plan.id).toBe("pro");
        expect(plan.name).toBe("Pro");
    });

    it("isValidPlanId should validate plan IDs", () => {
        expect(isValidPlanId("free")).toBe(true);
        expect(isValidPlanId("pro")).toBe(true);
        expect(isValidPlanId("business")).toBe(true);
        expect(isValidPlanId("enterprise")).toBe(false);
        expect(isValidPlanId("invalid")).toBe(false);
    });

    it("getUpgradePlan should return correct upgrade path", () => {
        expect(getUpgradePlan("free")?.id).toBe("pro");
        expect(getUpgradePlan("pro")?.id).toBe("business");
        expect(getUpgradePlan("business")).toBeNull();
    });
});
