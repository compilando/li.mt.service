/**
 * Plan configuration and feature access control system
 * Extensible design: add new resources or features here and they automatically work everywhere
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Resources with numeric limits (monthly quotas or absolute limits)
 * To add a new resource: just add it to this type and to PLANS config below
 */
export type PlanResource = 
    | "links"           // New links per month
    | "tags"            // Total tags in organization
    | "domains"         // Custom domains
    | "apiKeys"         // API keys
    | "members"         // Team members
    | "clicksPerMonth"; // Tracked clicks per month

/**
 * Boolean features (has access or not)
 * To add a new feature: just add it to this type and to PLANS config below
 */
export type PlanFeature = 
    | "utm"                 // UTM builder
    | "ogOverrides"         // Custom link previews (Open Graph)
    | "passwordProtection"  // Password-protected links
    | "linkExpiration"      // Link expiration dates
    | "smartRouting"        // Geo/device targeting
    | "abTesting"           // A/B testing with routing rules
    | "apiAccess"           // API access
    | "roleBasedAccess"     // Role-based access control
    | "prioritySupport";    // Priority customer support

/**
 * Plan identifiers
 */
export type PlanId = "free" | "pro" | "business";

/**
 * Plan configuration
 */
export interface PlanConfig {
    id: PlanId;
    name: string;
    description: string;
    price: number;                              // Monthly price in USD
    yearlyPrice: number;                        // Yearly price in USD (with discount)
    recommended?: boolean;                      // Show "Recommended" badge
    limits: Record<PlanResource, number>;       // -1 = unlimited
    features: PlanFeature[];                    // List of enabled features
    analyticsRetentionDays: number;             // How long to keep analytics data
}

/**
 * Resource usage tracking
 */
export interface ResourceUsage {
    links: number;
    tags: number;
    domains: number;
    apiKeys: number;
    members: number;
    clicksPerMonth: number;
}

/**
 * Serializable state for client-side PlanGuard
 */
export interface PlanGuardState {
    planId: PlanId;
    planName: string;
    price: number;
    limits: Record<PlanResource, number>;
    features: PlanFeature[];
    usage: ResourceUsage;
    analyticsRetentionDays: number;
}

// ─── Plan Configurations ─────────────────────────────────────────────────────

export const PLANS: Record<PlanId, PlanConfig> = {
    free: {
        id: "free",
        name: "Free",
        description: "For individuals getting started with link management",
        price: 0,
        yearlyPrice: 0,
        limits: {
            links: 25,
            tags: 5,
            domains: 0,
            apiKeys: 0,
            members: 1,
            clicksPerMonth: 1000,
        },
        features: [],
        analyticsRetentionDays: 30,
    },
    pro: {
        id: "pro",
        name: "Pro",
        description: "For professionals who need advanced features",
        price: 30,
        yearlyPrice: 288, // 20% discount: 30 * 12 * 0.8
        recommended: true,
        limits: {
            links: 1000,
            tags: 25,
            domains: 5,
            apiKeys: 3,
            members: 3,
            clicksPerMonth: 50000,
        },
        features: [
            "utm",
            "ogOverrides",
            "passwordProtection",
            "linkExpiration",
            "smartRouting",
            "apiAccess",
        ],
        analyticsRetentionDays: 365,
    },
    business: {
        id: "business",
        name: "Business",
        description: "For teams that need unlimited scale and advanced collaboration",
        price: 90,
        yearlyPrice: 864, // 20% discount: 90 * 12 * 0.8
        limits: {
            links: -1,          // unlimited
            tags: -1,           // unlimited
            domains: 25,
            apiKeys: 10,
            members: 10,
            clicksPerMonth: 250000,
        },
        features: [
            "utm",
            "ogOverrides",
            "passwordProtection",
            "linkExpiration",
            "smartRouting",
            "abTesting",
            "apiAccess",
            "roleBasedAccess",
            "prioritySupport",
        ],
        analyticsRetentionDays: 1095, // 3 years
    },
};

/**
 * Get plan upgrade path (next higher plan)
 */
export function getUpgradePlan(currentPlanId: PlanId): PlanConfig | null {
    if (currentPlanId === "free") return PLANS.pro;
    if (currentPlanId === "pro") return PLANS.business;
    return null;
}

/**
 * Get all plan IDs in order
 */
export const PLAN_ORDER: PlanId[] = ["free", "pro", "business"];

// ─── Feature Metadata ────────────────────────────────────────────────────────

export interface FeatureMetadata {
    name: string;
    description: string;
    category: "links" | "analytics" | "domains" | "api" | "team";
}

export const FEATURE_METADATA: Record<PlanFeature, FeatureMetadata> = {
    utm: {
        name: "UTM Builder",
        description: "Track campaign performance with UTM parameters",
        category: "links",
    },
    ogOverrides: {
        name: "Custom Link Previews",
        description: "Customize Open Graph metadata for social sharing",
        category: "links",
    },
    passwordProtection: {
        name: "Password Protection",
        description: "Protect links with passwords",
        category: "links",
    },
    linkExpiration: {
        name: "Link Expiration",
        description: "Set expiration dates for links",
        category: "links",
    },
    smartRouting: {
        name: "Smart Routing",
        description: "Route users based on geo-location and device",
        category: "links",
    },
    abTesting: {
        name: "A/B Testing",
        description: "Split traffic between multiple destinations",
        category: "links",
    },
    apiAccess: {
        name: "API Access",
        description: "Programmatic access via REST API",
        category: "api",
    },
    roleBasedAccess: {
        name: "Role-based Access",
        description: "Granular permissions for team members",
        category: "team",
    },
    prioritySupport: {
        name: "Priority Support",
        description: "Get help faster with priority support",
        category: "team",
    },
};

export const RESOURCE_METADATA: Record<PlanResource, { name: string; unit: string }> = {
    links: { name: "Links", unit: "links/month" },
    tags: { name: "Tags", unit: "tags" },
    domains: { name: "Custom Domains", unit: "domains" },
    apiKeys: { name: "API Keys", unit: "keys" },
    members: { name: "Team Members", unit: "members" },
    clicksPerMonth: { name: "Tracked Clicks", unit: "clicks/month" },
};

// ─── PlanGuard Class ─────────────────────────────────────────────────────────

/**
 * Main class for checking plan limits and features
 * Can be used on both server and client (with appropriate initialization)
 */
export class PlanGuard {
    private plan: PlanConfig;
    private usage: ResourceUsage;

    constructor(planId: PlanId, usage: ResourceUsage) {
        this.plan = PLANS[planId];
        this.usage = usage;
    }

    // ── Numeric Limits ───────────────────────────────────────────────────────

    /**
     * Get the limit for a resource (-1 = unlimited)
     */
    getLimit(resource: PlanResource): number {
        return this.plan.limits[resource];
    }

    /**
     * Get current usage for a resource
     */
    getUsage(resource: PlanResource): number {
        return this.usage[resource];
    }

    /**
     * Get remaining quota for a resource (-1 = unlimited)
     */
    getRemaining(resource: PlanResource): number {
        const limit = this.getLimit(resource);
        if (limit === -1) return -1;
        return Math.max(0, limit - this.usage[resource]);
    }

    /**
     * Check if user can create a new resource
     */
    canCreate(resource: PlanResource, count: number = 1): boolean {
        const limit = this.getLimit(resource);
        if (limit === -1) return true; // unlimited
        return this.usage[resource] + count <= limit;
    }

    /**
     * Check if a resource is unlimited in this plan
     */
    isUnlimited(resource: PlanResource): boolean {
        return this.getLimit(resource) === -1;
    }

    /**
     * Get usage percentage (0-100, or -1 for unlimited)
     */
    getUsagePercentage(resource: PlanResource): number {
        const limit = this.getLimit(resource);
        if (limit === -1) return -1;
        if (limit === 0) return 100;
        return Math.min(100, Math.round((this.usage[resource] / limit) * 100));
    }

    // ── Boolean Features ─────────────────────────────────────────────────────

    /**
     * Check if plan has access to a feature
     */
    hasFeature(feature: PlanFeature): boolean {
        return this.plan.features.includes(feature);
    }

    /**
     * Get list of all features in this plan
     */
    listFeatures(): PlanFeature[] {
        return [...this.plan.features];
    }

    // ── Plan Info ────────────────────────────────────────────────────────────

    /**
     * Get plan ID
     */
    getPlanId(): PlanId {
        return this.plan.id;
    }

    /**
     * Get plan name
     */
    getPlanName(): string {
        return this.plan.name;
    }

    /**
     * Get monthly price
     */
    getPrice(): number {
        return this.plan.price;
    }

    /**
     * Get yearly price
     */
    getYearlyPrice(): number {
        return this.plan.yearlyPrice;
    }

    /**
     * Get analytics retention in days
     */
    getAnalyticsRetentionDays(): number {
        return this.plan.analyticsRetentionDays;
    }

    /**
     * Get upgrade plan (next tier)
     */
    getUpgradePlan(): PlanConfig | null {
        return getUpgradePlan(this.plan.id);
    }

    /**
     * Check if this is a paid plan
     */
    isPaid(): boolean {
        return this.plan.price > 0;
    }

    // ── Serialization ────────────────────────────────────────────────────────

    /**
     * Convert to JSON for client-side use
     */
    toJSON(): PlanGuardState {
        return {
            planId: this.plan.id,
            planName: this.plan.name,
            price: this.plan.price,
            limits: { ...this.plan.limits },
            features: [...this.plan.features],
            usage: { ...this.usage },
            analyticsRetentionDays: this.plan.analyticsRetentionDays,
        };
    }

    /**
     * Create PlanGuard from serialized state
     */
    static fromJSON(state: PlanGuardState): PlanGuard {
        return new PlanGuard(state.planId, state.usage);
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Get plan config by ID
 */
export function getPlanConfig(planId: PlanId): PlanConfig {
    return PLANS[planId];
}

/**
 * Check if a plan ID is valid
 */
export function isValidPlanId(planId: string): planId is PlanId {
    return planId in PLANS;
}

/**
 * Get all plans as array
 */
export function getAllPlans(): PlanConfig[] {
    return PLAN_ORDER.map((id) => PLANS[id]);
}
