import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// ─── Global Mocks ────────────────────────────────────────────────────────────

// Mock next/cache (revalidatePath, revalidateTag)
vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
    headers: vi.fn(() => new Headers()),
    cookies: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    })),
}));

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
    default: {
        link: {
            create: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        tag: {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            delete: vi.fn(),
        },
        member: {
            create: vi.fn(),
            findFirst: vi.fn(),
        },
        organization: {
            create: vi.fn(),
            findUnique: vi.fn(),
        },
        linkTag: {
            createMany: vi.fn(),
            deleteMany: vi.fn(),
        },
    },
}));

// Mock auth/user session
vi.mock("@/lib/user", () => ({
    getSession: vi.fn(),
    getUser: vi.fn(),
}));
