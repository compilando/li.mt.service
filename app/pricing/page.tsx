import { PricingPageContent } from "./content";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { detectLocale, getTranslations } from "@/lib/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing",
    description: "Simple, transparent pricing for teams of all sizes. Choose the plan that fits your needs.",
};

export default async function PricingPage() {
    const locale = await detectLocale();
    const t = getTranslations(locale);

    return (
        <>
            <MarketingNavbar locale={locale} translations={t.navbar} />
            <PricingPageContent locale={locale} translations={t.pricing} />
        </>
    );
}
