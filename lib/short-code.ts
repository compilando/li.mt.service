import { customAlphabet } from "nanoid";
import { SHORT_CODE_ALPHABET, SHORT_CODE_LENGTH } from "@/lib/constants";

const generate = customAlphabet(SHORT_CODE_ALPHABET, SHORT_CODE_LENGTH);

/**
 * Generate a unique short code for a link
 */
export function generateShortCode(length?: number): string {
    if (length) {
        return customAlphabet(SHORT_CODE_ALPHABET, length)();
    }
    return generate();
}

/**
 * Reserved short codes that cannot be used (routes, api paths, etc.)
 */
export const RESERVED_SHORT_CODES = new Set([
    "app",
    "api",
    "signin",
    "signup",
    "signout",
    "auth",
    "admin",
    "settings",
    "dashboard",
    "links",
    "analytics",
    "domains",
    "tags",
    "help",
    "docs",
    "about",
    "pricing",
    "blog",
    "terms",
    "privacy",
    "contact",
    "status",
]);

/**
 * Check if a short code is reserved
 */
export function isReservedShortCode(code: string): boolean {
    return RESERVED_SHORT_CODES.has(code.toLowerCase());
}
