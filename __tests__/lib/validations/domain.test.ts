import { describe, it, expect } from "vitest";
import { createDomainSchema } from "@/lib/validations/domain";

describe("createDomainSchema", () => {
    const validInput = {
        name: "example.com",
        organizationId: "org-1",
    };

    it("accepts valid domain", () => {
        const result = createDomainSchema.parse(validInput);
        expect(result.name).toBe("example.com");
        expect(result.organizationId).toBe("org-1");
    });

    it("accepts subdomain", () => {
        expect(() =>
            createDomainSchema.parse({ ...validInput, name: "links.example.com" })
        ).not.toThrow();
    });

    it("accepts various TLDs", () => {
        expect(() => createDomainSchema.parse({ ...validInput, name: "example.io" })).not.toThrow();
        expect(() => createDomainSchema.parse({ ...validInput, name: "example.co.uk" })).not.toThrow();
        expect(() => createDomainSchema.parse({ ...validInput, name: "example.dev" })).not.toThrow();
    });

    it("requires name", () => {
        expect(() => createDomainSchema.parse({ organizationId: "org-1" })).toThrow();
    });

    it("requires organizationId", () => {
        expect(() => createDomainSchema.parse({ name: "example.com" })).toThrow();
    });

    it("rejects empty name", () => {
        expect(() =>
            createDomainSchema.parse({ ...validInput, name: "" })
        ).toThrow();
    });

    it("rejects invalid domain names", () => {
        expect(() =>
            createDomainSchema.parse({ ...validInput, name: "not a domain" })
        ).toThrow();
        expect(() =>
            createDomainSchema.parse({ ...validInput, name: "http://example.com" })
        ).toThrow();
        expect(() =>
            createDomainSchema.parse({ ...validInput, name: "example" })
        ).toThrow();
    });

    it("rejects domains with invalid characters", () => {
        expect(() =>
            createDomainSchema.parse({ ...validInput, name: "exam_ple.com" })
        ).toThrow();
    });
});
