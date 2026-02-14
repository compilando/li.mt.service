export const APP_NAME = "Limt";
export const APP_DESCRIPTION = "Modern link management platform";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Short code configuration
export const SHORT_CODE_LENGTH = 7;
export const SHORT_CODE_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Limits per plan
export const PLAN_LIMITS = {
    free: {
        linksPerMonth: 25,
        clicksPerMonth: 1_000,
        domains: 0,
        apiKeys: 0,
        tags: 5,
    },
    pro: {
        linksPerMonth: 1_000,
        clicksPerMonth: 50_000,
        domains: 5,
        apiKeys: 3,
        tags: 50,
    },
    business: {
        linksPerMonth: -1, // unlimited
        clicksPerMonth: -1,
        domains: -1,
        apiKeys: -1,
        tags: -1,
    },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
