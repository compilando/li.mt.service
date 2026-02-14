/**
 * URL utilities for link management
 */

// ─── Constants ───────────────────────────────────────────────────────────────

export const URL_PROTOCOLS = [
    { value: "https://", label: "HTTPS", default: true },
    { value: "http://", label: "HTTP", default: false },
    { value: "ftp://", label: "FTP", default: false },
    { value: "ftps://", label: "FTPS", default: false },
] as const;

export type UrlProtocol = (typeof URL_PROTOCOLS)[number]["value"];

// ─── Protocol Detection ──────────────────────────────────────────────────────

/**
 * Extracts the protocol from a URL if present
 * @param input - The URL input
 * @returns The protocol (e.g., "https://") or null if no protocol
 */
export function extractProtocol(input: string): string | null {
    const trimmed = input.trim();

    // Match standard protocols (http://, https://, ftp://, etc.)
    const protocolMatch = trimmed.match(/^([a-zA-Z][a-zA-Z\d+\-.]*:\/\/)/);
    if (protocolMatch) {
        return protocolMatch[1];
    }

    // Match special protocols (mailto:, tel:)
    const specialMatch = trimmed.match(/^(mailto:|tel:)/);
    if (specialMatch) {
        return specialMatch[1];
    }

    return null;
}

/**
 * Removes the protocol from a URL
 * @param input - The URL input
 * @returns URL without protocol
 */
export function removeProtocol(input: string): string {
    const trimmed = input.trim();
    const protocol = extractProtocol(trimmed);

    if (protocol) {
        return trimmed.slice(protocol.length);
    }

    return trimmed;
}

/**
 * Splits a URL into protocol and path parts
 * @param input - The URL input
 * @returns Object with protocol and path
 */
export function splitUrl(input: string): { protocol: string; path: string } {
    const trimmed = input.trim();
    const detectedProtocol = extractProtocol(trimmed);

    if (detectedProtocol) {
        return {
            protocol: detectedProtocol,
            path: trimmed.slice(detectedProtocol.length),
        };
    }

    return {
        protocol: "https://",
        path: trimmed,
    };
}

// ─── URL Normalization ───────────────────────────────────────────────────────

/**
 * Normalizes a URL by adding https:// protocol if missing
 * @param input - The URL input from user
 * @returns Normalized URL with protocol
 */
export function normalizeUrl(input: string): string {
    if (!input) return input;

    const trimmed = input.trim();

    // Already has a protocol (e.g., https://, http://, ftp://, mailto:, tel:)
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed) || /^(mailto|tel):/.test(trimmed)) {
        return trimmed;
    }

    // Add https:// if no protocol
    return `https://${trimmed}`;
}

/**
 * Builds a complete URL from protocol and path
 * @param protocol - The protocol (e.g., "https://")
 * @param path - The path without protocol
 * @returns Complete URL
 */
export function buildUrl(protocol: string, path: string): string {
    const cleanPath = path.trim();

    if (!cleanPath) {
        return "";
    }

    // If path already has a protocol, use it as-is
    if (extractProtocol(cleanPath)) {
        return cleanPath;
    }

    return `${protocol}${cleanPath}`;
}

/**
 * Validates if a string is a valid URL
 * @param input - The URL to validate
 * @returns true if valid URL, false otherwise
 */
export function isValidUrl(input: string): boolean {
    try {
        const normalized = normalizeUrl(input);
        new URL(normalized);
        return true;
    } catch {
        return false;
    }
}

// ─── Colors ──────────────────────────────────────────────────────────────────

/**
 * Generates a random hex color for tags
 * @returns Hex color string (e.g., "#3B82F6")
 */
export function generateRandomColor(): string {
    const colors = [
        "#3B82F6", // blue
        "#8B5CF6", // violet
        "#EC4899", // pink
        "#F59E0B", // amber
        "#10B981", // emerald
        "#6366F1", // indigo
        "#F97316", // orange
        "#14B8A6", // teal
        "#EF4444", // red
        "#84CC16", // lime
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}
