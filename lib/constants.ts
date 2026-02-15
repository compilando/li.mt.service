export const APP_NAME = "Limt";
export const APP_DESCRIPTION = "Modern link management platform";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Short code configuration
export const SHORT_CODE_LENGTH = 7;
export const SHORT_CODE_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Reserved short codes (cannot be used for links)
export const RESERVED_SHORT_CODES = [
    "api",
    "app",
    "signin",
    "signup",
    "pricing",
    "about",
    "contact",
    "admin",
    "dashboard",
    "settings",
    "analytics",
];
