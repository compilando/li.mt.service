"use client";

import { usePlanGuard } from "@/hooks/use-plan-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export function UsageWidget() {
  const planGuard = usePlanGuard();
  const router = useRouter();

  if (planGuard.loading) {
    return (
      <div className="px-4 py-3 border rounded-lg bg-sidebar-accent/50 animate-pulse">
        <div className="h-4 bg-sidebar-accent rounded mb-2"></div>
        <div className="h-2 bg-sidebar-accent rounded mb-4"></div>
        <div className="h-4 bg-sidebar-accent rounded mb-2"></div>
        <div className="h-2 bg-sidebar-accent rounded"></div>
      </div>
    );
  }

  const linksUsage = planGuard.getUsage("links");
  const linksLimit = planGuard.getLimit("links");
  const linksPercentage = planGuard.getUsagePercentage("links");
  
  const clicksUsage = planGuard.getUsage("clicksPerMonth");
  const clicksLimit = planGuard.getLimit("clicksPerMonth");
  const clicksPercentage = planGuard.getUsagePercentage("clicksPerMonth");

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const upgradePlan = planGuard.getUpgradePlan();
  const showUpgrade = upgradePlan && (linksPercentage > 80 || clicksPercentage > 80);

  return (
    <div className="px-3 py-2">
      <div className="border rounded-lg bg-sidebar-accent/30 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Usage</span>
          <Badge variant="outline" className="text-xs">
            {planGuard.getPlanName()}
          </Badge>
        </div>

        {/* Links */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Links</span>
            <span className="font-medium">
              {linksUsage} of {planGuard.isUnlimited("links") ? "∞" : formatNumber(linksLimit)}
            </span>
          </div>
          {!planGuard.isUnlimited("links") && (
            <Progress 
              value={Math.min(100, linksPercentage)} 
              className="h-1.5"
            />
          )}
        </div>

        {/* Clicks */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Clicks</span>
            <span className="font-medium">
              {formatNumber(clicksUsage)} of {planGuard.isUnlimited("clicksPerMonth") ? "∞" : formatNumber(clicksLimit)}
            </span>
          </div>
          {!planGuard.isUnlimited("clicksPerMonth") && (
            <Progress 
              value={Math.min(100, clicksPercentage)} 
              className="h-1.5"
            />
          )}
        </div>

        {/* Upgrade CTA */}
        {showUpgrade && (
          <button
            onClick={() => router.push("/app/settings?tab=billing")}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            Upgrade to {upgradePlan.name}
          </button>
        )}
      </div>
    </div>
  );
}
