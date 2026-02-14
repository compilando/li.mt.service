import { BarChart3, Link, MousePointerClick, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
    totalLinks: number;
    totalClicks: number;
    activeLinks?: number;
}

export function StatsCards({ totalLinks, totalClicks, activeLinks }: StatsCardsProps) {
    const avgClicksPerLink = totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0;

    const stats = [
        {
            label: "Total Links",
            value: totalLinks,
            icon: Link,
        },
        {
            label: "Total Clicks",
            value: totalClicks,
            icon: MousePointerClick,
        },
        {
            label: "Avg. Clicks / Link",
            value: avgClicksPerLink,
            icon: TrendingUp,
        },
        {
            label: "Active Links",
            value: activeLinks ?? totalLinks,
            icon: BarChart3,
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <Card key={stat.label}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-3">
                                <stat.icon className="size-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold tabular-nums tracking-tight">{stat.value.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
