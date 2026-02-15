import { headers } from "next/headers";

/**
 * Supported languages
 */
export type Locale = "es" | "en";

/**
 * Detect user's preferred language from Accept-Language header
 */
export async function detectLocale(): Promise<Locale> {
    const headersList = await headers();
    const acceptLanguage = headersList.get("accept-language");

    if (!acceptLanguage) {
        return "en"; // Default to English if no header
    }

    // Parse Accept-Language header (e.g., "es-ES,es;q=0.9,en;q=0.8")
    const languages = acceptLanguage
        .split(",")
        .map((lang) => {
            const [code, qValue] = lang.trim().split(";q=");
            return {
                code: code.split("-")[0].toLowerCase(), // Extract base language (es from es-ES)
                priority: qValue ? parseFloat(qValue) : 1.0,
            };
        })
        .sort((a, b) => b.priority - a.priority);

    // Find first supported language
    for (const lang of languages) {
        if (lang.code === "es" || lang.code === "en") {
            return lang.code as Locale;
        }
    }

    return "en"; // Default fallback
}

/**
 * Translation dictionaries
 */
export const translations = {
    en: {
        // Marketing Navbar
        navbar: {
            pricing: "Pricing",
            signIn: "Sign in",
        },
        // Homepage
        home: {
            hero: {
                title: "Link management,",
                titleHighlight: "simplified",
                subtitle: "Shorten, analyze, and share your links with a modern platform designed for teams.",
                ctaPrimary: "Get started free",
                ctaSecondary: "View plans",
            },
            features: {
                customLinks: {
                    title: "Custom links",
                    description: "Create memorable short links with custom codes and your own domains.",
                },
                analytics: {
                    title: "Detailed analytics",
                    description: "Real-time tracking of clicks, geographic location, devices, and more.",
                },
                teams: {
                    title: "Team collaboration",
                    description: "Manage links as a team with organizations, roles, and permissions.",
                },
            },
            cta: {
                title: "Ready to get started?",
                subtitle: "Create your free account. No credit card required.",
                button: "Start now",
            },
            footer: {
                copyright: "All rights reserved.",
                pricing: "Pricing",
            },
        },
        // Pricing Page
        pricing: {
            header: {
                title: "Simple, transparent pricing",
                subtitle: "Choose the plan that fits your needs. All plans include core link management features.",
            },
            billing: {
                monthly: "Monthly",
                yearly: "Yearly",
                savePercent: "Save 20%",
            },
            plans: {
                free: {
                    description: "For individuals getting started with link management",
                },
                pro: {
                    description: "For professionals who need advanced features",
                },
                business: {
                    description: "For teams that need unlimited scale and advanced collaboration",
                },
            },
            recommended: "Recommended",
            perMonth: "/month",
            billedYearly: "Billed {amount} yearly",
            upTo: "Up to",
            unlimited: "Unlimited",
            links: "links",
            tags: "tags",
            domains: "custom domains",
            teamMember: "team member",
            teamMembers: "team members",
            analyticsRetention: "analytics retention",
            days: "days",
            year: "year",
            years: "years",
            utmBuilder: "UTM builder",
            smartRouting: "Smart routing",
            apiAccess: "API access",
            getStarted: "Get Started",
            startFreeTrial: "Start Free Trial",
            compareFeatures: "Compare all features",
            feature: "Feature",
            trackedClicks: "Tracked clicks",
            customDomains: "Custom domains",
            apiKeys: "API keys",
            cta: {
                title: "Ready to get started?",
                subtitle: "Start your 14-day free trial. No credit card required.",
                button: "Start Free Trial",
            },
        },
    },
    es: {
        // Marketing Navbar
        navbar: {
            pricing: "Precios",
            signIn: "Iniciar sesión",
        },
        // Homepage
        home: {
            hero: {
                title: "Gestión de enlaces,",
                titleHighlight: "simplificada",
                subtitle: "Acorta, analiza y comparte tus enlaces con una plataforma moderna diseñada para equipos.",
                ctaPrimary: "Comenzar gratis",
                ctaSecondary: "Ver planes",
            },
            features: {
                customLinks: {
                    title: "Enlaces personalizados",
                    description: "Crea enlaces cortos memorables con códigos personalizados y dominios propios.",
                },
                analytics: {
                    title: "Analíticas detalladas",
                    description: "Seguimiento en tiempo real de clicks, ubicación geográfica, dispositivos y más.",
                },
                teams: {
                    title: "Colaboración en equipo",
                    description: "Gestiona enlaces en equipo con organizaciones, roles y permisos.",
                },
            },
            cta: {
                title: "¿Listo para empezar?",
                subtitle: "Crea tu cuenta gratis. Sin tarjeta de crédito.",
                button: "Comenzar ahora",
            },
            footer: {
                copyright: "Todos los derechos reservados.",
                pricing: "Precios",
            },
        },
        // Pricing Page
        pricing: {
            header: {
                title: "Precios simples y transparentes",
                subtitle: "Elige el plan que se ajuste a tus necesidades. Todos los planes incluyen funciones básicas de gestión de enlaces.",
            },
            billing: {
                monthly: "Mensual",
                yearly: "Anual",
                savePercent: "Ahorra 20%",
            },
            plans: {
                free: {
                    description: "Para personas que empiezan con la gestión de enlaces",
                },
                pro: {
                    description: "Para profesionales que necesitan funciones avanzadas",
                },
                business: {
                    description: "Para equipos que necesitan escala ilimitada y colaboración avanzada",
                },
            },
            recommended: "Recomendado",
            perMonth: "/mes",
            billedYearly: "Facturado ${amount} anualmente",
            upTo: "Hasta",
            unlimited: "Ilimitado",
            links: "enlaces",
            tags: "etiquetas",
            domains: "dominios personalizados",
            teamMember: "miembro del equipo",
            teamMembers: "miembros del equipo",
            analyticsRetention: "retención de analíticas",
            days: "días",
            year: "año",
            years: "años",
            utmBuilder: "Constructor UTM",
            smartRouting: "Enrutamiento inteligente",
            apiAccess: "Acceso API",
            getStarted: "Comenzar",
            startFreeTrial: "Comenzar prueba gratis",
            compareFeatures: "Comparar todas las funciones",
            feature: "Función",
            trackedClicks: "Clicks rastreados",
            customDomains: "Dominios personalizados",
            apiKeys: "Claves API",
            cta: {
                title: "¿Listo para comenzar?",
                subtitle: "Comienza tu prueba gratuita de 14 días. Sin tarjeta de crédito.",
                button: "Comenzar prueba gratis",
            },
        },
    },
} as const;

/**
 * Get translations for a specific locale
 */
export function getTranslations(locale: Locale) {
    return translations[locale];
}
