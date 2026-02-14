"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getConditionAliases } from "@/lib/actions/routing";
import type { ConditionAlias } from "@/generated/prisma/client";

interface RoutingAliasPickerProps {
    onSelect: (variable: string, operator: string, value: string) => void;
}

export function RoutingAliasPicker({ onSelect }: RoutingAliasPickerProps) {
    const [aliases, setAliases] = useState<ConditionAlias[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getConditionAliases({ includeSystem: true })
            .then(setAliases)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return null;

    // Group popular aliases
    const osAliases = aliases.filter((a) => a.category === "os");
    const deviceAliases = aliases.filter((a) => a.category === "device");
    const countryAliases = aliases.filter((a) => a.category === "country").slice(0, 6);

    return (
        <div className="space-y-2">
            {/* OS */}
            {osAliases.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {osAliases.map((alias) => (
                        <Button
                            key={alias.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onSelect(alias.variable, alias.operator, alias.value)}
                        >
                            {alias.icon} {alias.name}
                        </Button>
                    ))}
                </div>
            )}

            {/* Device */}
            {deviceAliases.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {deviceAliases.map((alias) => (
                        <Button
                            key={alias.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onSelect(alias.variable, alias.operator, alias.value)}
                        >
                            {alias.icon} {alias.name}
                        </Button>
                    ))}
                </div>
            )}

            {/* Countries */}
            {countryAliases.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {countryAliases.map((alias) => (
                        <Button
                            key={alias.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onSelect(alias.variable, alias.operator, alias.value)}
                        >
                            {alias.icon} {alias.name}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}
