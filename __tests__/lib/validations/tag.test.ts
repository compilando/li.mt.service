import { describe, it, expect } from "vitest";
import { createTagSchema } from "@/lib/validations/tag";

describe("createTagSchema", () => {
    const validInput = {
        name: "marketing",
        organizationId: "org-1",
    };

    it("accepts valid input with defaults", () => {
        const result = createTagSchema.parse(validInput);
        expect(result.name).toBe("marketing");
        expect(result.color).toBe("#6B7280"); // default color
        expect(result.organizationId).toBe("org-1");
    });

    it("accepts custom color", () => {
        const result = createTagSchema.parse({ ...validInput, color: "#FF5733" });
        expect(result.color).toBe("#FF5733");
    });

    it("requires name", () => {
        expect(() => createTagSchema.parse({ organizationId: "org-1" })).toThrow();
    });

    it("requires organizationId", () => {
        expect(() => createTagSchema.parse({ name: "test" })).toThrow();
    });

    it("rejects empty name", () => {
        expect(() => createTagSchema.parse({ ...validInput, name: "" })).toThrow();
    });

    it("rejects name longer than 50 chars", () => {
        expect(() =>
            createTagSchema.parse({ ...validInput, name: "x".repeat(51) })
        ).toThrow();
    });

    it("accepts name up to 50 chars", () => {
        const result = createTagSchema.parse({ ...validInput, name: "x".repeat(50) });
        expect(result.name).toHaveLength(50);
    });

    it("rejects invalid hex color", () => {
        expect(() =>
            createTagSchema.parse({ ...validInput, color: "red" })
        ).toThrow();
        expect(() =>
            createTagSchema.parse({ ...validInput, color: "#GGG" })
        ).toThrow();
        expect(() =>
            createTagSchema.parse({ ...validInput, color: "#12345" })
        ).toThrow();
    });

    it("accepts valid hex colors", () => {
        expect(() => createTagSchema.parse({ ...validInput, color: "#000000" })).not.toThrow();
        expect(() => createTagSchema.parse({ ...validInput, color: "#FFFFFF" })).not.toThrow();
        expect(() => createTagSchema.parse({ ...validInput, color: "#ff5733" })).not.toThrow();
    });
});
