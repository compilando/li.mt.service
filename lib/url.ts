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
