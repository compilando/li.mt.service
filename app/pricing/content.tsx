"use client";

import { useState } from "react";
import { getAllPlans, FEATURE_METADATA, RESOURCE_METADATA, type PlanFeature, type PlanResource, type PlanId } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import type { Locale, translations } from "@/lib/i18n";

type BillingPeriod = "monthly" | "yearly";

interface PricingPageContentProps {
    locale: Locale;
    translations: typeof translations.en.pricing | typeof translations.es.pricing;
}

export function PricingPageContent({ locale, translations: t }: PricingPageContentProps) {
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
    const plans = getAllPlans();

    const getPlanDescription = (planId: PlanId) => {
        return t.plans[planId].description;
    };

    const formatRetention = (days: number) => {
        if (days >= 365) {
            const years = Math.round(days / 365);
            return `${years} ${years > 1 ? t.years : t.year}`;
        }
        return `${days} ${t.days}`;
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="container mx-auto px-4 py-16">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h1 className="text-4xl font-bold mb-4">{t.header.title}</h1>
                    <p className="text-xl text-muted-foreground">
                        {t.header.subtitle}
                    </p>
                </div>

                {/* Billing Toggle */}
                <div className="flex justify-center items-center gap-4 mb-12">
                    <span className={billingPeriod === "monthly" ? "font-semibold" : "text-muted-foreground"}>
                        {t.billing.monthly}
                    </span>
                    <button
                        onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        style={{
                            backgroundColor: billingPeriod === "yearly" ? "var(--primary)" : "var(--muted)",
                        }}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                billingPeriod === "yearly" ? "translate-x-6" : "translate-x-1"
                            }`}
                        />
                    </button>
                    <span className={billingPeriod === "yearly" ? "font-semibold" : "text-muted-foreground"}>
                        {t.billing.yearly}
                        <Badge variant="secondary" className="ml-2">
                            {t.billing.savePercent}
                        </Badge>
                    </span>
                </div>

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
                    {plans.map((plan) => {
                        const price = billingPeriod === "monthly" ? plan.price : plan.yearlyPrice / 12;
                        const isFree = plan.price === 0;

                        return (
                            <Card
                                key={plan.id}
                                className={`relative ${plan.recommended ? "border-primary shadow-lg scale-105" : ""}`}
                            >
                                {plan.recommended && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-primary text-primary-foreground">{t.recommended}</Badge>
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                    <CardDescription>{getPlanDescription(plan.id)}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold">
                                                ${Math.round(price)}
                                            </span>
                                            {!isFree && <span className="text-muted-foreground">{t.perMonth}</span>}
                                        </div>
                                        {billingPeriod === "yearly" && !isFree && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {t.billedYearly.replace("{amount}", plan.yearlyPrice.toString())}
                                            </p>
                                        )}
                                    </div>

                                    {/* Key features */}
                                    <ul className="space-y-3">
                                        {/* Resource limits */}
                                        {(["links", "tags", "domains"] as const).map((resource) => {
                                            const limit = plan.limits[resource];
                                            const resourceText = resource === "links" ? t.links : resource === "tags" ? t.tags : t.domains;
                                            return (
                                                <li key={resource} className="flex items-start gap-2">
                                                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                    <span className="text-sm">
                                                        {limit === -1 ? t.unlimited : new Intl.NumberFormat("en-US").format(limit)}{" "}
                                                        {resourceText}
                                                    </span>
                                                </li>
                                            );
                                        })}

                                        {/* Members */}
                                        <li className="flex items-start gap-2">
                                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                            <span className="text-sm">
                                                {t.upTo} {plan.limits.members === -1 ? t.unlimited.toLowerCase() : plan.limits.members}{" "}
                                                {plan.limits.members === 1 ? t.teamMember : t.teamMembers}
                                            </span>
                                        </li>

                                        {/* Analytics */}
                                        <li className="flex items-start gap-2">
                                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                            <span className="text-sm">
                                                {formatRetention(plan.analyticsRetentionDays)}{" "}
                                                {t.analyticsRetention}
                                            </span>
                                        </li>

                                        {/* Key features */}
                                        {plan.features.includes("utm") && (
                                            <li className="flex items-start gap-2">
                                                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                <span className="text-sm">{t.utmBuilder}</span>
                                            </li>
                                        )}
                                        {plan.features.includes("smartRouting") && (
                                            <li className="flex items-start gap-2">
                                                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                <span className="text-sm">{t.smartRouting}</span>
                                            </li>
                                        )}
                                        {plan.features.includes("apiAccess") && (
                                            <li className="flex items-start gap-2">
                                                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                <span className="text-sm">{t.apiAccess}</span>
                                            </li>
                                        )}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" variant={plan.recommended ? "default" : "outline"}>
                                        {isFree ? t.getStarted : t.startFreeTrial}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                {/* Feature Comparison Table */}
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-8">{t.compareFeatures}</h2>

                    {/* Links & Features */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">Links & Features</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-4 font-medium">{t.feature}</th>
                                        {plans.map((plan) => (
                                            <th key={plan.id} className="text-center p-4 font-medium">
                                                {plan.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Resource rows */}
                                    {(["links", "tags"] as PlanResource[]).map((resource) => {
                                        const meta = RESOURCE_METADATA[resource];
                                        return (
                                            <tr key={resource} className="border-b">
                                                <td className="p-4">{meta.name}</td>
                                                {plans.map((plan) => {
                                                    const limit = plan.limits[resource];
                                                    return (
                                                        <td key={plan.id} className="text-center p-4">
                                                            {limit === -1 ? t.unlimited : new Intl.NumberFormat("en-US").format(limit)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}

                                    {/* Feature rows */}
                                    {(["utm", "ogOverrides", "passwordProtection", "linkExpiration", "smartRouting", "abTesting"] as PlanFeature[]).map(
                                        (feature) => {
                                            const meta = FEATURE_METADATA[feature];
                                            return (
                                                <tr key={feature} className="border-b">
                                                    <td className="p-4">{meta.name}</td>
                                                    {plans.map((plan) => (
                                                        <td key={plan.id} className="text-center p-4">
                                                            {plan.features.includes(feature) ? (
                                                                <Check className="h-5 w-5 text-primary mx-auto" />
                                                            ) : (
                                                                <X className="h-5 w-5 text-muted-foreground mx-auto" />
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Analytics */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">Analytics</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-4 font-medium">{t.feature}</th>
                                        {plans.map((plan) => (
                                            <th key={plan.id} className="text-center p-4 font-medium">
                                                {plan.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="p-4">{t.trackedClicks}</td>
                                        {plans.map((plan) => {
                                            const limit = plan.limits.clicksPerMonth;
                                            return (
                                                <td key={plan.id} className="text-center p-4">
                                                    {limit === -1 ? t.unlimited : `${(limit / 1000).toFixed(0)}K`}/{locale === "es" ? "mes" : "month"}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-4">{t.analyticsRetention}</td>
                                        {plans.map((plan) => (
                                            <td key={plan.id} className="text-center p-4">
                                                {formatRetention(plan.analyticsRetentionDays)}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Domains & API */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">Domains & API</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-4 font-medium">{t.feature}</th>
                                        {plans.map((plan) => (
                                            <th key={plan.id} className="text-center p-4 font-medium">
                                                {plan.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="p-4">{t.customDomains}</td>
                                        {plans.map((plan) => {
                                            const limit = plan.limits.domains;
                                            return (
                                                <td key={plan.id} className="text-center p-4">
                                                    {limit === -1 ? t.unlimited : limit === 0 ? "-" : limit}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-4">{t.apiAccess}</td>
                                        {plans.map((plan) => (
                                            <td key={plan.id} className="text-center p-4">
                                                {plan.features.includes("apiAccess") ? (
                                                    <Check className="h-5 w-5 text-primary mx-auto" />
                                                ) : (
                                                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-4">{t.apiKeys}</td>
                                        {plans.map((plan) => {
                                            const limit = plan.limits.apiKeys;
                                            return (
                                                <td key={plan.id} className="text-center p-4">
                                                    {limit === -1 ? t.unlimited : limit === 0 ? "-" : limit}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Team */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">Team & Support</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-4 font-medium">{t.feature}</th>
                                        {plans.map((plan) => (
                                            <th key={plan.id} className="text-center p-4 font-medium">
                                                {plan.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="p-4">Team members</td>
                                        {plans.map((plan) => {
                                            const limit = plan.limits.members;
                                            return (
                                                <td key={plan.id} className="text-center p-4">
                                                    {limit === -1 ? t.unlimited : limit}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    {(["roleBasedAccess", "prioritySupport"] as PlanFeature[]).map((feature) => {
                                        const meta = FEATURE_METADATA[feature];
                                        return (
                                            <tr key={feature} className="border-b">
                                                <td className="p-4">{meta.name}</td>
                                                {plans.map((plan) => (
                                                    <td key={plan.id} className="text-center p-4">
                                                        {plan.features.includes(feature) ? (
                                                            <Check className="h-5 w-5 text-primary mx-auto" />
                                                        ) : (
                                                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center mt-16">
                    <h2 className="text-2xl font-bold mb-4">{t.cta.title}</h2>
                    <p className="text-muted-foreground mb-8">
                        {t.cta.subtitle}
                    </p>
                    <Button size="lg">{t.cta.button}</Button>
                </div>
            </div>
        </div>
    );
}
