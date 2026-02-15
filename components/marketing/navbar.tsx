import { Button } from "@/components/ui/button";
import { GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";

interface MarketingNavbarProps {
    locale: Locale;
    translations: {
        pricing: string;
        signIn: string;
    };
}

export function MarketingNavbar({ locale, translations }: MarketingNavbarProps) {
    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
                    <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                        <GalleryVerticalEnd className="size-5" />
                    </div>
                    Limt
                </Link>

                <div className="flex items-center gap-4">
                    <Link
                        href="/pricing"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {translations.pricing}
                    </Link>
                    <Button asChild size="sm">
                        <Link href="/signin">{translations.signIn}</Link>
                    </Button>
                </div>
            </div>
        </nav>
    );
}
