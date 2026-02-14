"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { getOrganizationAnalytics } from "@/lib/actions/analytics";

interface OrgAnalytics {
    totalLinks: number;
    totalClicks: number;
    clicksByDay: Array<{ date: Date; clicks: number }>;
}

export function AnalyticsPageContent() {
    const { activeOrganization } = useActiveOrganization();
    const [analytics, setAnalytics] = useState<OrgAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeOrganization) return;

        let cancelled = false;
        setLoading(true);
        getOrganizationAnalytics(activeOrganization.id, 30)
            .then((result) => {
                if (!cancelled) setAnalytics(result);
            })
            .catch(console.error)
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [activeOrganization]);

    if (!activeOrganization) {
        return null;
    }

    return (
        <>
            <DashboardHeader title="Analytics" />

            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="border rounded-lg p-4 animate-pulse">
                            <div className="h-8 bg-muted rounded w-1/2 mb-2" />
                            <div className="h-4 bg-muted rounded w-2/3" />
                        </div>
                    ))}
                </div>
            ) : analytics ? (
                <div className="space-y-8">
                    <StatsCards
                        totalLinks={analytics.totalLinks}
                        totalClicks={analytics.totalClicks}
                    />

                    {/* Clicks by day — placeholder for future chart */}
                    {analytics.clicksByDay.length > 0 && (
                        <div className="border rounded-lg p-6">
                            <h3 className="font-medium mb-4">Clicks over time</h3>
                            <div className="flex items-end gap-1 h-32">
                                {analytics.clicksByDay.map((day, i) => {
                                    const max = Math.max(...analytics.clicksByDay.map((d) => d.clicks));
                                    const height = max > 0 ? (day.clicks / max) * 100 : 0;
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t min-w-1"
                                            style={{ height: `${Math.max(height, 2)}%` }}
                                            title={`${day.clicks} clicks`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-muted-foreground text-center py-8">
                    No analytics data available yet.
                </p>
            )}
        </>
    );
}
