import { describe, it, expect } from "vitest";
import {
    createRoutingRuleSchema,
    updateRoutingRuleSchema,
    ruleConditionSchema,
} from "@/lib/validations/routing";

describe("createRoutingRuleSchema", () => {
    it("should validate a complete routing rule", () => {
        const result = createRoutingRuleSchema.safeParse({
            linkId: "link-123",
            name: "Windows Users",
            destinationUrl: "https://example.com/windows",
            priority: 0,
            enabled: true,
            conditions: [
                {
                    variable: "device.os",
                    operator: "equals",
                    value: "Windows",
                },
            ],
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.destinationUrl).toBe("https://example.com/windows");
        }
    });

    it("should normalize destinationUrl without protocol", () => {
        const result = createRoutingRuleSchema.safeParse({
            linkId: "link-123",
            name: "Test Rule",
            destinationUrl: "bing.com",
            conditions: [
                {
                    variable: "device.os",
                    operator: "equals",
                    value: "Windows",
                },
            ],
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.destinationUrl).toBe("https://bing.com");
        }
    });

    it("should normalize destinationUrl with different protocols", () => {
        const result = createRoutingRuleSchema.safeParse({
            linkId: "link-123",
            name: "Test Rule",
            destinationUrl: "http://example.com",
            conditions: [
                {
                    variable: "device.os",
                    operator: "equals",
                    value: "Windows",
                },
            ],
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.destinationUrl).toBe("http://example.com");
        }
    });

    it("should fail with invalid destinationUrl", () => {
        const result = createRoutingRuleSchema.safeParse({
            linkId: "link-123",
            name: "Test Rule",
            destinationUrl: "not a url",
            conditions: [
                {
                    variable: "device.os",
                    operator: "equals",
                    value: "Windows",
                },
            ],
        });

        expect(result.success).toBe(false);
    });

    it("should fail without conditions", () => {
        const result = createRoutingRuleSchema.safeParse({
            linkId: "link-123",
            name: "Test Rule",
            destinationUrl: "https://example.com",
            conditions: [],
        });

        expect(result.success).toBe(false);
    });

    it("should validate with weight for A/B testing", () => {
        const result = createRoutingRuleSchema.safeParse({
            linkId: "link-123",
            name: "A/B Test Rule",
            destinationUrl: "https://example.com/variant-a",
            weight: 50,
            conditions: [
                {
                    variable: "random.percent",
                    operator: "lte",
                    value: "50",
                },
            ],
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.weight).toBe(50);
        }
    });

    it("should fail with invalid weight", () => {
        const result = createRoutingRuleSchema.safeParse({
            linkId: "link-123",
            name: "Test Rule",
            destinationUrl: "https://example.com",
            weight: 150, // > 100
            conditions: [
                {
                    variable: "device.os",
                    operator: "equals",
                    value: "Windows",
                },
            ],
        });

        expect(result.success).toBe(false);
    });

    it("should validate multiple conditions", () => {
        const result = createRoutingRuleSchema.safeParse({
            linkId: "link-123",
            name: "Multi-condition Rule",
            destinationUrl: "https://example.com",
            conditions: [
                {
                    variable: "device.os",
                    operator: "equals",
                    value: "Windows",
                },
                {
                    variable: "geo.country",
                    operator: "equals",
                    value: "US",
                },
            ],
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.conditions).toHaveLength(2);
        }
    });
});

describe("ruleConditionSchema", () => {
    it("should validate a condition", () => {
        const result = ruleConditionSchema.safeParse({
            variable: "device.os",
            operator: "equals",
            value: "Windows",
        });

        expect(result.success).toBe(true);
    });

    it("should fail with empty value", () => {
        const result = ruleConditionSchema.safeParse({
            variable: "device.os",
            operator: "equals",
            value: "",
        });

        expect(result.success).toBe(false);
    });

    it("should validate different operators", () => {
        const operators = [
            "equals",
            "not_equals",
            "contains",
            "not_contains",
            "in",
            "not_in",
            "gt",
            "gte",
            "lt",
            "lte",
            "between",
        ];

        operators.forEach((operator) => {
            const result = ruleConditionSchema.safeParse({
                variable: "device.os",
                operator,
                value: "test",
            });

            expect(result.success).toBe(true);
        });
    });

    it("should fail with invalid operator", () => {
        const result = ruleConditionSchema.safeParse({
            variable: "device.os",
            operator: "invalid_operator",
            value: "Windows",
        });

        expect(result.success).toBe(false);
    });
});

describe("updateRoutingRuleSchema", () => {
    it("should validate a complete update", () => {
        const result = updateRoutingRuleSchema.safeParse({
            id: "rule-123",
            name: "Updated Rule",
            destinationUrl: "https://example.com/new",
            conditions: [
                {
                    variable: "device.os",
                    operator: "equals",
                    value: "MacOS",
                },
            ],
        });

        expect(result.success).toBe(true);
    });

    it("should allow partial updates", () => {
        const result = updateRoutingRuleSchema.safeParse({
            id: "rule-123",
            name: "Just update the name",
        });

        expect(result.success).toBe(true);
    });

    it("should require id", () => {
        const result = updateRoutingRuleSchema.safeParse({
            name: "Missing ID",
        });

        expect(result.success).toBe(false);
    });

    it("should normalize URL in updates", () => {
        const result = updateRoutingRuleSchema.safeParse({
            id: "rule-123",
            destinationUrl: "google.com",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.destinationUrl).toBe("https://google.com");
        }
    });
});
