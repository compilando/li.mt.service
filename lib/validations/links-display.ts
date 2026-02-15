import { z } from "zod/v4";

/**
 * Validation schema for link display settings
 */
export const linkDisplaySettingsSchema = z.object({
  viewMode: z.enum(["cards", "rows"]).default("cards"),
  sortBy: z.enum(["createdAt", "clicks", "title", "shortCode"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  showArchived: z.boolean().default(false),
  displayProperties: z.object({
    shortLink: z.boolean().default(true),
    destinationUrl: z.boolean().default(true),
    title: z.boolean().default(true),
    description: z.boolean().default(false),
    createdDate: z.boolean().default(false),
    creator: z.boolean().default(false),
    tags: z.boolean().default(true),
    analytics: z.boolean().default(true),
  }).default({
    shortLink: true,
    destinationUrl: true,
    title: true,
    description: false,
    createdDate: false,
    creator: false,
    tags: true,
    analytics: true,
  }),
});

export type LinkDisplaySettings = z.infer<typeof linkDisplaySettingsSchema>;

/**
 * Validation schema for link filters
 */
export const linkFiltersSchema = z.object({
  tagIds: z.array(z.string()).default([]),
  domainIds: z.array(z.string()).default([]),
  creatorIds: z.array(z.string()).default([]),
  search: z.string().default(""),
});

export type LinkFilters = z.infer<typeof linkFiltersSchema>;
