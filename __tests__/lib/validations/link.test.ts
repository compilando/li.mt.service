import { describe, it, expect } from "vitest";
import {
    shortCodeSchema,
    createLinkSchema,
    updateLinkSchema,
    deleteLinkSchema,
    listLinksSchema,
} from "@/lib/validations/link";

describe("shortCodeSchema", () => {
    it("accepts valid short codes", () => {
        expect(() => shortCodeSchema.parse("abc123")).not.toThrow();
        expect(() => shortCodeSchema.parse("my-link")).not.toThrow();
        expect(() => shortCodeSchema.parse("test_code")).not.toThrow();
        expect(() => shortCodeSchema.parse("ABC123")).not.toThrow();
    });

    it("rejects codes shorter than 3 characters", () => {
        expect(() => shortCodeSchema.parse("ab")).toThrow();
        expect(() => shortCodeSchema.parse("a")).toThrow();
    });

    it("rejects codes longer than 32 characters", () => {
        const longCode = "a".repeat(33);
        expect(() => shortCodeSchema.parse(longCode)).toThrow();
    });

    it("rejects codes with invalid characters", () => {
        expect(() => shortCodeSchema.parse("abc 123")).toThrow(); // space
        expect(() => shortCodeSchema.parse("abc@123")).toThrow(); // @
        expect(() => shortCodeSchema.parse("abc/123")).toThrow(); // /
        expect(() => shortCodeSchema.parse("abc.123")).toThrow(); // .
    });

    it("accepts hyphens and underscores", () => {
        expect(() => shortCodeSchema.parse("my-link-123")).not.toThrow();
        expect(() => shortCodeSchema.parse("my_link_123")).not.toThrow();
    });
});

describe("createLinkSchema", () => {
    const validInput = {
        url: "https://example.com",
        organizationId: "org-1",
    };

    it("accepts minimal valid input", () => {
        const result = createLinkSchema.parse(validInput);
        expect(result.url).toBe("https://example.com");
        expect(result.organizationId).toBe("org-1");
    });

    it("accepts full input with all optional fields", () => {
        const fullInput = {
            ...validInput,
            shortCode: "my-link",
            title: "My Link",
            description: "A test link",
            comments: "Internal notes here",
            password: "secret123",
            expiresAt: "2026-12-31T23:59:59.000Z",
            utmSource: "google",
            utmMedium: "cpc",
            utmCampaign: "summer",
            utmTerm: "shoes",
            utmContent: "banner",
            ogTitle: "Custom OG Title",
            ogDescription: "Custom OG Description",
            ogImage: "https://example.com/og.png",
            domainId: "domain-1",
            tagIds: ["tag-1", "tag-2"],
        };
        const result = createLinkSchema.parse(fullInput);
        expect(result.title).toBe("My Link");
        expect(result.comments).toBe("Internal notes here");
        expect(result.tagIds).toEqual(["tag-1", "tag-2"]);
    });

    it("requires url", () => {
        expect(() => createLinkSchema.parse({ organizationId: "org-1" })).toThrow();
    });

    it("requires organizationId", () => {
        expect(() => createLinkSchema.parse({ url: "https://example.com" })).toThrow();
    });

    it("rejects invalid URLs", () => {
        // URLs that fail validation even after normalization
        expect(() => createLinkSchema.parse({ ...validInput, url: "://" })).toThrow();
        expect(() => createLinkSchema.parse({ ...validInput, url: "" })).toThrow();
        expect(() => createLinkSchema.parse({ ...validInput, url: "   " })).toThrow();
    });

    it("normalizes URLs without protocol", () => {
        const result = createLinkSchema.parse({ ...validInput, url: "example.com" });
        expect(result.url).toBe("https://example.com");
    });

    it("preserves URLs with different protocols", () => {
        const result = createLinkSchema.parse({ ...validInput, url: "http://example.com" });
        expect(result.url).toBe("http://example.com");
    });

    it("rejects title longer than 200 chars", () => {
        expect(() =>
            createLinkSchema.parse({ ...validInput, title: "x".repeat(201) })
        ).toThrow();
    });

    it("rejects description longer than 500 chars", () => {
        expect(() =>
            createLinkSchema.parse({ ...validInput, description: "x".repeat(501) })
        ).toThrow();
    });

    it("rejects comments longer than 1000 chars", () => {
        expect(() =>
            createLinkSchema.parse({ ...validInput, comments: "x".repeat(1001) })
        ).toThrow();
    });

    it("accepts comments up to 1000 chars", () => {
        const result = createLinkSchema.parse({
            ...validInput,
            comments: "x".repeat(1000),
        });
        expect(result.comments).toHaveLength(1000);
    });

    it("validates UTM fields max length", () => {
        expect(() =>
            createLinkSchema.parse({ ...validInput, utmSource: "x".repeat(201) })
        ).toThrow();
    });

    it("validates OG image must be a valid URL", () => {
        // Invalid URLs that fail even after normalization
        expect(() =>
            createLinkSchema.parse({ ...validInput, ogImage: "://" })
        ).toThrow();
    });

    it("normalizes OG image URLs", () => {
        const result = createLinkSchema.parse({ ...validInput, ogImage: "example.com/image.png" });
        expect(result.ogImage).toBe("https://example.com/image.png");
    });

    it("accepts empty string for ogImage", () => {
        const result = createLinkSchema.parse({ ...validInput, ogImage: "" });
        expect(result.ogImage).toBe("");
    });

    it("accepts empty tagIds array", () => {
        const result = createLinkSchema.parse({ ...validInput, tagIds: [] });
        expect(result.tagIds).toEqual([]);
    });
});

describe("updateLinkSchema", () => {
    it("requires id", () => {
        expect(() => updateLinkSchema.parse({})).toThrow();
    });

    it("accepts only id (all other fields optional)", () => {
        const result = updateLinkSchema.parse({ id: "link-1" });
        expect(result.id).toBe("link-1");
    });

    it("does not accept organizationId", () => {
        const result = updateLinkSchema.parse({
            id: "link-1",
            title: "Updated",
        });
        expect(result).not.toHaveProperty("organizationId");
    });

    it("accepts partial updates", () => {
        const result = updateLinkSchema.parse({
            id: "link-1",
            title: "New Title",
            archived: true,
        });
        expect(result.title).toBe("New Title");
        expect(result.archived).toBe(true);
    });
});

describe("deleteLinkSchema", () => {
    it("requires id", () => {
        expect(() => deleteLinkSchema.parse({})).toThrow();
    });

    it("accepts valid id", () => {
        const result = deleteLinkSchema.parse({ id: "link-1" });
        expect(result.id).toBe("link-1");
    });
});

describe("listLinksSchema", () => {
    it("requires organizationId", () => {
        expect(() => listLinksSchema.parse({})).toThrow();
    });

    it("has default values for pagination", () => {
        const result = listLinksSchema.parse({ organizationId: "org-1" });
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(20);
        expect(result.sortBy).toBe("createdAt");
        expect(result.sortOrder).toBe("desc");
    });

    it("rejects page less than 1", () => {
        expect(() =>
            listLinksSchema.parse({ organizationId: "org-1", page: 0 })
        ).toThrow();
    });

    it("rejects pageSize greater than 100", () => {
        expect(() =>
            listLinksSchema.parse({ organizationId: "org-1", pageSize: 101 })
        ).toThrow();
    });

    it("accepts valid sort options", () => {
        const result = listLinksSchema.parse({
            organizationId: "org-1",
            sortBy: "clicks",
            sortOrder: "asc",
        });
        expect(result.sortBy).toBe("clicks");
        expect(result.sortOrder).toBe("asc");
    });

    it("rejects invalid sort field", () => {
        expect(() =>
            listLinksSchema.parse({ organizationId: "org-1", sortBy: "invalid" })
        ).toThrow();
    });

    it("accepts optional filters", () => {
        const result = listLinksSchema.parse({
            organizationId: "org-1",
            search: "test",
            tagId: "tag-1",
            archived: false,
        });
        expect(result.search).toBe("test");
        expect(result.tagId).toBe("tag-1");
        expect(result.archived).toBe(false);
    });
});
