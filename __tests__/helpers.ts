import { vi } from "vitest";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/user";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MockSession {
    user: {
        id: string;
        email: string;
        name: string;
        image: string | null;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    session: {
        id: string;
        expiresAt: Date;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        token: string;
        ipAddress?: string | null;
        userAgent?: string | null;
        activeOrganizationId?: string | null;
    };
}

// ─── Factory Functions ───────────────────────────────────────────────────────

export function createMockSession(overrides?: Partial<MockSession["user"]>): MockSession {
    const now = new Date();
    return {
        user: {
            id: "user-1",
            email: "test@example.com",
            name: "Test User",
            image: null,
            emailVerified: true,
            createdAt: now,
            updatedAt: now,
            ...overrides,
        },
        session: {
            id: "session-1",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            createdAt: now,
            updatedAt: now,
            userId: overrides?.id || "user-1",
            token: "mock-token-abc123",
            ipAddress: null,
            userAgent: null,
            activeOrganizationId: null,
        },
    };
}

export function createMockLink(overrides?: Record<string, unknown>) {
    return {
        id: "link-1",
        shortCode: "abc1234",
        url: "https://example.com",
        title: "Test Link",
        description: null,
        comments: null,
        password: null,
        expiresAt: null,
        archived: false,
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        utmTerm: null,
        utmContent: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        iosTarget: null,
        androidTarget: null,
        domainId: null,
        organizationId: "org-1",
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        ...overrides,
    };
}

export function createMockTag(overrides?: Record<string, unknown>) {
    return {
        id: "tag-1",
        name: "marketing",
        color: "#FF5733",
        organizationId: "org-1",
        createdAt: new Date("2025-01-01"),
        ...overrides,
    };
}

export function createMockMember(overrides?: Record<string, unknown>) {
    return {
        id: "member-1",
        organizationId: "org-1",
        userId: "user-1",
        role: "owner",
        createdAt: new Date("2025-01-01"),
        ...overrides,
    };
}

export function createMockOrganization(overrides?: Record<string, unknown>) {
    return {
        id: "org-1",
        name: "Test Org",
        slug: "test-org",
        logo: null,
        metadata: null,
        plan: "free",
        createdAt: new Date("2025-01-01"),
        ...overrides,
    };
}

// ─── Mock Setup Helpers ──────────────────────────────────────────────────────

/**
 * Set up authenticated session mock
 */
export function mockAuthenticated(overrides?: Partial<MockSession["user"]>) {
    const session = createMockSession(overrides);
    vi.mocked(getSession).mockResolvedValue(session);
    return session;
}

/**
 * Set up unauthenticated session mock
 */
export function mockUnauthenticated() {
    vi.mocked(getSession).mockResolvedValue(null);
}

/**
 * Set up organization membership mock
 */
export function mockOrgMembership(exists = true) {
    const mock = vi.mocked(prisma.member.findFirst);
    if (exists) {
        mock.mockResolvedValue(createMockMember() as never);
    } else {
        mock.mockResolvedValue(null as never);
    }
    return mock;
}

/**
 * Reset all mocks to initial state
 */
export function resetAllMocks() {
    vi.clearAllMocks();
}
