"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
    createRoutingRule,
    updateRoutingRule,
    deleteRoutingRule,
} from "@/lib/actions/routing";
import { RoutingConditionRow } from "./routing-condition-row";
import { RoutingAliasPicker } from "./routing-alias-picker";
import { UrlInput } from "@/components/ui/url-input";
import type { RoutingRule, RuleCondition } from "@/generated/prisma/client";
import type { ConditionOperator } from "@/lib/validations/routing";

interface RoutingRuleEditorProps {
    linkId: string;
    rule: (RoutingRule & { conditions: RuleCondition[] }) | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface ConditionInput {
    variable: string;
    operator: ConditionOperator;
    value: string;
}

export function RoutingRuleEditor({
    linkId,
    rule,
    open,
    onOpenChange,
    onSuccess,
}: RoutingRuleEditorProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [destinationUrl, setDestinationUrl] = useState("");
    const [weight, setWeight] = useState<number | undefined>(undefined);
    const [conditions, setConditions] = useState<ConditionInput[]>([]);

    useEffect(() => {
        if (rule) {
            setName(rule.name);
            setDestinationUrl(rule.destinationUrl);
            setWeight(rule.weight || undefined);
            setConditions(
                rule.conditions.map((c) => ({
                    variable: c.variable,
                    operator: c.operator as ConditionOperator,
                    value: c.value,
                }))
            );
        } else {
            setName("");
            setDestinationUrl("");
            setWeight(undefined);
            setConditions([{ variable: "device.os", operator: "equals", value: "" }]);
        }
        setError(null);
    }, [rule, open]);

    const handleAddCondition = () => {
        setConditions([...conditions, { variable: "device.os", operator: "equals", value: "" }]);
    };

    const handleRemoveCondition = (index: number) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const handleConditionChange = (index: number, field: keyof ConditionInput, value: string | ConditionOperator) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        setConditions(newConditions);
    };

    const handleAliasSelect = (variable: string, operator: string, value: string) => {
        if (conditions.length === 1 && !conditions[0].value) {
            setConditions([{ variable, operator: operator as ConditionOperator, value }]);
        } else {
            setConditions([...conditions, { variable, operator: operator as ConditionOperator, value }]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const validConditions = conditions.filter((c) => c.value.trim() !== "");

        if (validConditions.length === 0) {
            setError("At least one condition is required");
            setLoading(false);
            return;
        }

        const data = {
            linkId,
            name,
            destinationUrl,
            weight: weight || undefined,
            enabled: true,
            priority: 0,
            conditions: validConditions,
        };

        const result = rule
            ? await updateRoutingRule({ ...data, id: rule.id })
            : await createRoutingRule(data);

        setLoading(false);

        if (result.success) {
            onSuccess();
            onOpenChange(false);
        } else {
            setError(result.error);
        }
    };

    const handleDelete = async () => {
        if (!rule) return;
        if (!confirm("Are you sure you want to delete this routing rule?")) return;

        setLoading(true);
        const result = await deleteRoutingRule(rule.id);
        setLoading(false);

        if (result.success) {
            onSuccess();
            onOpenChange(false);
        } else {
            setError(result.error || "Failed to delete rule");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl p-0 gap-0 max-h-[90vh] overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>{rule ? "Edit" : "Create"} Routing Rule</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(90vh-140px)]">
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        {/* Rule Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Rule Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Windows Users"
                                required
                            />
                        </div>

                        {/* Destination URL */}
                        <div className="space-y-2">
                            <Label htmlFor="destinationUrl">Destination URL</Label>
                            <UrlInput
                                id="destinationUrl"
                                value={destinationUrl}
                                onChange={setDestinationUrl}
                                placeholder="example.com/windows"
                                required
                            />
                        </div>

                        {/* Quick Aliases */}
                        <div className="space-y-2">
                            <Label>Quick Add (Popular Conditions)</Label>
                            <RoutingAliasPicker onSelect={handleAliasSelect} />
                        </div>

                        {/* Conditions */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Conditions (all must match)</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddCondition}
                                >
                                    <Plus className="size-3" />
                                    Add
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {conditions.map((condition, index) => (
                                    <RoutingConditionRow
                                        key={index}
                                        condition={condition}
                                        onChange={(field: string, value: string) =>
                                            handleConditionChange(index, field as keyof ConditionInput, value as ConditionOperator)
                                        }
                                        onRemove={() => handleRemoveCondition(index)}
                                        canRemove={conditions.length > 1}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* A/B Testing */}
                        <div className="space-y-2">
                            <Label htmlFor="weight">A/B Testing Weight (%) - Optional</Label>
                            <Input
                                id="weight"
                                type="number"
                                min="1"
                                max="100"
                                value={weight || ""}
                                onChange={(e) =>
                                    setWeight(e.target.value ? parseInt(e.target.value) : undefined)
                                }
                                placeholder="Leave empty for regular rule"
                            />
                            <p className="text-xs text-muted-foreground">
                                For A/B testing, set a percentage (e.g., 50). Rules with weights will be
                                selected probabilistically.
                            </p>
                        </div>
                    </div>

                    <div className="border-t px-6 py-4 flex items-center justify-between gap-4 bg-background">
                        <div className="flex-1">
                            {error && (
                                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-1.5">
                                    {error}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {rule && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={loading}
                                >
                                    <Trash2 className="size-4" />
                                    Delete
                                </Button>
                            )}
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="size-4 animate-spin" />}
                                {rule ? "Update" : "Create"} Rule
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
