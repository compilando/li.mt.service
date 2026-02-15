import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link2, BarChart3, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { detectLocale, getTranslations } from "@/lib/i18n";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/app");
  }

  const locale = await detectLocale();
  const t = getTranslations(locale);

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNavbar locale={locale} translations={t.navbar} />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 md:py-32">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            {t.home.hero.title}{" "}
            <span className="text-primary">{t.home.hero.titleHighlight}</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t.home.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/signin">
                {t.home.hero.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">{t.home.hero.ctaSecondary}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  <Link2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t.home.features.customLinks.title}</CardTitle>
                <CardDescription>
                  {t.home.features.customLinks.description}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t.home.features.analytics.title}</CardTitle>
                <CardDescription>
                  {t.home.features.analytics.description}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t.home.features.teams.title}</CardTitle>
                <CardDescription>
                  {t.home.features.teams.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.home.cta.title}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t.home.cta.subtitle}
          </p>
          <Button asChild size="lg">
            <Link href="/signin">{t.home.cta.button}</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Limt. {t.home.footer.copyright}
            </p>
            <div className="flex gap-6">
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t.home.footer.pricing}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
