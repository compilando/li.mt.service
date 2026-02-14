"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { conditionOperators, conditionVariables } from "@/lib/validations/routing";

interface RoutingConditionRowProps {
    condition: {
        variable: string;
        operator: string;
        value: string;
    };
    onChange: (field: string, value: string) => void;
    onRemove: () => void;
    canRemove: boolean;
}

export function RoutingConditionRow({
    condition,
    onChange,
    onRemove,
    canRemove,
}: RoutingConditionRowProps) {
    return (
        <div className="flex items-center gap-2">
            <Select value={condition.variable} onValueChange={(v) => onChange("variable", v)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="device.os">Device OS</SelectItem>
                    <SelectItem value="device.type">Device Type</SelectItem>
                    <SelectItem value="device.browser">Browser</SelectItem>
                    <SelectItem value="geo.country">Country</SelectItem>
                    <SelectItem value="geo.region">Region</SelectItem>
                    <SelectItem value="geo.city">City</SelectItem>
                    <SelectItem value="time.hour">Hour (0-23)</SelectItem>
                    <SelectItem value="time.day">Day (1-7)</SelectItem>
                    <SelectItem value="http.language">Language</SelectItem>
                    <SelectItem value="http.referrer">Referrer</SelectItem>
                </SelectContent>
            </Select>

            <Select value={condition.operator} onValueChange={(v) => onChange("operator", v)}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="equals">equals</SelectItem>
                    <SelectItem value="not_equals">not equals</SelectItem>
                    <SelectItem value="contains">contains</SelectItem>
                    <SelectItem value="not_contains">not contains</SelectItem>
                    <SelectItem value="in">in (comma-sep)</SelectItem>
                    <SelectItem value="not_in">not in</SelectItem>
                    <SelectItem value="gt">greater than</SelectItem>
                    <SelectItem value="gte">greater or equal</SelectItem>
                    <SelectItem value="lt">less than</SelectItem>
                    <SelectItem value="lte">less or equal</SelectItem>
                    <SelectItem value="between">between (X-Y)</SelectItem>
                </SelectContent>
            </Select>

            <Input
                value={condition.value}
                onChange={(e) => onChange("value", e.target.value)}
                placeholder="Value"
                className="flex-1"
            />

            {canRemove && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={onRemove}
                >
                    <X className="size-4" />
                </Button>
            )}
        </div>
    );
}
