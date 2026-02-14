import type { RoutingRule, RuleCondition } from "@/generated/prisma/client";

// ─── Request Context ─────────────────────────────────────────────────────────

export interface RequestContext {
    device: {
        type: string; // "mobile" | "desktop" | "tablet"
        os: string; // "Windows" | "macOS" | "Linux" | "Android" | "iOS" | "Other"
        browser: string; // "Chrome" | "Firefox" | "Safari" | "Edge" | "Opera" | "Other"
    };
    geo: {
        country?: string; // ISO code "ES", "US", etc.
        region?: string;
        city?: string;
    };
    time: {
        hour: number; // 0-23
        day: number; // 1-7 (Monday = 1)
        month: number; // 1-12
    };
    http: {
        language: string; // "es", "en", etc.
        referrer?: string;
        query: Record<string, string>;
    };
    random: {
        percent: number; // 0-100 (for A/B testing)
    };
}

// ─── Rule Evaluation Result ──────────────────────────────────────────────────

export interface RuleEvaluationResult {
    matched: boolean;
    destinationUrl?: string;
    ruleName?: string;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type RuleWithConditions = RoutingRule & {
    conditions: RuleCondition[];
};

// ─── Condition Evaluation ────────────────────────────────────────────────────

function getValue(context: RequestContext, variable: string): string | number | undefined {
    const parts = variable.split(".");
    if (parts.length !== 2) return undefined;

    const [category, field] = parts;

    switch (category) {
        case "device":
            return context.device[field as keyof typeof context.device];
        case "geo":
            return context.geo[field as keyof typeof context.geo];
        case "time":
            return context.time[field as keyof typeof context.time];
        case "http":
            if (field.startsWith("query.")) {
                const queryKey = field.replace("query.", "");
                return context.http.query[queryKey];
            }
            if (field === "language") return context.http.language;
            if (field === "referrer") return context.http.referrer;
            return undefined;
        case "random":
            return context.random[field as keyof typeof context.random];
        default:
            return undefined;
    }
}

function evaluateCondition(condition: RuleCondition, context: RequestContext): boolean {
    const actualValue = getValue(context, condition.variable);
    if (actualValue === undefined) return false;

    const actual = String(actualValue).toLowerCase();
    const expected = condition.value.toLowerCase();

    switch (condition.operator) {
        case "equals":
            return actual === expected;

        case "not_equals":
            return actual !== expected;

        case "contains":
            return actual.includes(expected);

        case "not_contains":
            return !actual.includes(expected);

        case "in": {
            // Value is comma-separated list: "ES,US,MX"
            const values = expected.split(",").map((v: string) => v.trim());
            return values.includes(actual);
        }

        case "not_in": {
            const values = expected.split(",").map((v: string) => v.trim());
            return !values.includes(actual);
        }

        case "gt":
            return Number(actualValue) > Number(condition.value);

        case "gte":
            return Number(actualValue) >= Number(condition.value);

        case "lt":
            return Number(actualValue) < Number(condition.value);

        case "lte":
            return Number(actualValue) <= Number(condition.value);

        case "between": {
            // Value format: "14-18" or "1-5"
            const [min, max] = expected.split("-").map((v: string) => Number(v.trim()));
            const num = Number(actualValue);
            return num >= min && num <= max;
        }

        default:
            return false;
    }
}

function evaluateRule(rule: RuleWithConditions, context: RequestContext): boolean {
    if (!rule.enabled) return false;
    if (rule.conditions.length === 0) return false;

    // ALL conditions must match (AND logic)
    return rule.conditions.every((condition: RuleCondition) => evaluateCondition(condition, context));
}

// ─── A/B Testing ─────────────────────────────────────────────────────────────

function selectFromABGroup(rules: RuleWithConditions[], randomPercent: number): RuleWithConditions | null {
    // Rules with weight are A/B variants
    // Sort by priority first
    const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

    // Calculate cumulative weights
    let cumulative = 0;
    const segments: Array<{ rule: RuleWithConditions; start: number; end: number }> = [];

    for (const rule of sortedRules) {
        const weight = rule.weight || 0;
        segments.push({
            rule,
            start: cumulative,
            end: cumulative + weight,
        });
        cumulative += weight;
    }

    // Normalize random percent to total weight
    const normalizedRandom = (randomPercent / 100) * cumulative;

    // Find which segment the random number falls into
    for (const segment of segments) {
        if (normalizedRandom >= segment.start && normalizedRandom < segment.end) {
            return segment.rule;
        }
    }

    return null;
}

// ─── Main Evaluation ─────────────────────────────────────────────────────────

export function evaluateRoutingRules(
    rules: RuleWithConditions[],
    context: RequestContext
): RuleEvaluationResult {
    if (rules.length === 0) {
        return { matched: false };
    }

    // Sort rules by priority (lower number = higher priority)
    const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

    // Group by priority and weight status
    const priorityGroups = new Map<number, RuleWithConditions[]>();

    for (const rule of sortedRules) {
        const group = priorityGroups.get(rule.priority) || [];
        group.push(rule);
        priorityGroups.set(rule.priority, group);
    }

    // Evaluate in priority order
    for (const [, group] of Array.from(priorityGroups.entries()).sort((a, b) => a[0] - b[0])) {
        // Filter to only rules that match conditions
        const matchingRules = group.filter((rule) => evaluateRule(rule, context));

        if (matchingRules.length === 0) continue;

        // Check if this is an A/B test group (has weights)
        const abRules = matchingRules.filter((r) => r.weight !== null && r.weight > 0);

        if (abRules.length > 0) {
            // A/B testing: select based on random percentage
            const selectedRule = selectFromABGroup(abRules, context.random.percent);
            if (selectedRule) {
                return {
                    matched: true,
                    destinationUrl: selectedRule.destinationUrl,
                    ruleName: selectedRule.name,
                };
            }
        }

        // Regular rules (no A/B): return first match
        const firstMatch = matchingRules.find((r) => !r.weight);
        if (firstMatch) {
            return {
                matched: true,
                destinationUrl: firstMatch.destinationUrl,
                ruleName: firstMatch.name,
            };
        }
    }

    return { matched: false };
}

// ─── Context Builders ────────────────────────────────────────────────────────

export function detectDevice(userAgent: string): { type: string; os: string; browser: string } {
    const ua = userAgent.toLowerCase();

    // Device type
    let type = "desktop";
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
        type = "mobile";
    } else if (/tablet|ipad/i.test(ua)) {
        type = "tablet";
    }

    // OS
    let os = "Other";
    if (/windows nt/i.test(ua)) os = "Windows";
    else if (/mac os x/i.test(ua)) os = "macOS";
    else if (/linux/i.test(ua) && !/android/i.test(ua)) os = "Linux";
    else if (/android/i.test(ua)) os = "Android";
    else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";

    // Browser
    let browser = "Other";
    if (/firefox/i.test(ua)) browser = "Firefox";
    else if (/edg/i.test(ua)) browser = "Edge";
    else if (/opr|opera/i.test(ua)) browser = "Opera";
    else if (/chrome/i.test(ua)) browser = "Chrome";
    else if (/safari/i.test(ua)) browser = "Safari";

    return { type, os, browser };
}

export function buildRequestContext(
    userAgent: string,
    headers: Record<string, string | undefined>,
    query: Record<string, string>
): RequestContext {
    const device = detectDevice(userAgent);

    // Geo from headers (Vercel/Cloudflare)
    const country = headers["x-vercel-ip-country"] || headers["cf-ipcountry"];
    const region = headers["x-vercel-ip-country-region"];
    const city = headers["x-vercel-ip-city"];

    // Time
    const now = new Date();
    const time = {
        hour: now.getHours(),
        day: now.getDay() || 7, // Sunday = 7, Monday = 1
        month: now.getMonth() + 1,
    };

    // HTTP
    const language = (headers["accept-language"] || "en").split(",")[0].split("-")[0];
    const referrer = headers["referer"] || headers["referrer"];

    // Random (for A/B testing)
    const random = {
        percent: Math.random() * 100,
    };

    return {
        device,
        geo: { country, region, city },
        time,
        http: { language, referrer, query },
        random,
    };
}
