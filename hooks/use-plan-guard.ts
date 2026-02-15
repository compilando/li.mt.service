"use client";

import { useEffect, useState } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { getPlanGuardState } from "@/lib/actions/plans";
import { PlanGuard, type PlanGuardState, type PlanResource, type PlanFeature } from "@/lib/plans";

/**
 * React hook for accessing plan limits and features on the client
 * Automatically updates when active organization changes
 */
export function usePlanGuard() {
    const { activeOrganization } = useActiveOrganization();
    const [guard, setGuard] = useState<PlanGuard | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!activeOrganization) {
            setGuard(null);
            setLoading(false);
            return;
        }

        let isCancelled = false;

        const loadPlanGuard = async () => {
            setLoading(true);
            setError(null);

            const result = await getPlanGuardState({
                organizationId: activeOrganization.id,
            });

            if (isCancelled) return;

            if (result.success) {
                setGuard(PlanGuard.fromJSON(result.data));
            } else {
                setError(result.error);
                // Set a default free plan guard on error
                setGuard(
                    new PlanGuard("free", {
                        links: 0,
                        tags: 0,
                        domains: 0,
                        apiKeys: 0,
                        members: 0,
                        clicksPerMonth: 0,
                    })
                );
            }

            setLoading(false);
        };

        loadPlanGuard();

        return () => {
            isCancelled = true;
        };
    }, [activeOrganization?.id]);

    // Return null-safe methods
    return {
        // Loading state
        loading,
        error,

        // Limit checks
        canCreate: (resource: PlanResource, count?: number) =>
            guard?.canCreate(resource, count) ?? false,
        getLimit: (resource: PlanResource) => guard?.getLimit(resource) ?? 0,
        getUsage: (resource: PlanResource) => guard?.getUsage(resource) ?? 0,
        getRemaining: (resource: PlanResource) => guard?.getRemaining(resource) ?? 0,
        isUnlimited: (resource: PlanResource) => guard?.isUnlimited(resource) ?? false,
        getUsagePercentage: (resource: PlanResource) => guard?.getUsagePercentage(resource) ?? 0,

        // Feature checks
        hasFeature: (feature: PlanFeature) => guard?.hasFeature(feature) ?? false,
        listFeatures: () => guard?.listFeatures() ?? [],

        // Plan info
        getPlanId: () => guard?.getPlanId() ?? "free",
        getPlanName: () => guard?.getPlanName() ?? "Free",
        getPrice: () => guard?.getPrice() ?? 0,
        getYearlyPrice: () => guard?.getYearlyPrice() ?? 0,
        getAnalyticsRetentionDays: () => guard?.getAnalyticsRetentionDays() ?? 30,
        getUpgradePlan: () => guard?.getUpgradePlan() ?? null,
        isPaid: () => guard?.isPaid() ?? false,

        // Raw guard (for advanced use)
        guard,
    };
}
