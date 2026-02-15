import { describe, it, expect } from "vitest";
import {
  linkDisplaySettingsSchema,
  linkFiltersSchema,
} from "@/lib/validations/links-display";

describe("linkDisplaySettingsSchema", () => {
  it("should validate default settings", () => {
    const result = linkDisplaySettingsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.viewMode).toBe("cards");
      expect(result.data.sortBy).toBe("createdAt");
      expect(result.data.sortOrder).toBe("desc");
      expect(result.data.showArchived).toBe(false);
    }
  });

  it("should validate custom settings", () => {
    const result = linkDisplaySettingsSchema.safeParse({
      viewMode: "rows",
      sortBy: "clicks",
      sortOrder: "asc",
      showArchived: true,
      displayProperties: {
        shortLink: true,
        destinationUrl: false,
        title: true,
        description: true,
        createdDate: true,
        creator: false,
        tags: true,
        analytics: true,
      },
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid view mode", () => {
    const result = linkDisplaySettingsSchema.safeParse({
      viewMode: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid sort by", () => {
    const result = linkDisplaySettingsSchema.safeParse({
      sortBy: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should accept all valid sort by options", () => {
    const validOptions = ["createdAt", "clicks", "title", "shortCode"];
    validOptions.forEach((sortBy) => {
      const result = linkDisplaySettingsSchema.safeParse({ sortBy });
      expect(result.success).toBe(true);
    });
  });
});

describe("linkFiltersSchema", () => {
  it("should validate default filters", () => {
    const result = linkFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tagIds).toEqual([]);
      expect(result.data.domainIds).toEqual([]);
      expect(result.data.creatorIds).toEqual([]);
      expect(result.data.search).toBe("");
    }
  });

  it("should validate custom filters", () => {
    const result = linkFiltersSchema.safeParse({
      tagIds: ["tag1", "tag2"],
      domainIds: ["domain1"],
      creatorIds: ["user1", "user2"],
      search: "test",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tagIds).toEqual(["tag1", "tag2"]);
      expect(result.data.domainIds).toEqual(["domain1"]);
      expect(result.data.creatorIds).toEqual(["user1", "user2"]);
      expect(result.data.search).toBe("test");
    }
  });

  it("should accept empty arrays", () => {
    const result = linkFiltersSchema.safeParse({
      tagIds: [],
      domainIds: [],
      creatorIds: [],
    });
    expect(result.success).toBe(true);
  });
});
