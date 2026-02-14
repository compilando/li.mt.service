"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Zap } from "lucide-react";
import { RoutingAliasPicker } from "./routing-alias-picker";
import { RoutingConditionRow } from "./routing-condition-row";
import { UrlInput } from "@/components/ui/url-input";
import type { ConditionOperator } from "@/lib/validations/routing";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MemoryRoutingRule {
    name: string;
    destinationUrl: string;
    priority: number;
    weight?: number;
    enabled: boolean;
    conditions: Array<{
        variable: string;
        operator: ConditionOperator;
        value: string;
    }>;
}

interface RoutingBuilderMemoryProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultUrl: string;
    initialRules?: MemoryRoutingRule[];
    onSave: (rules: MemoryRoutingRule[]) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RoutingBuilderMemory({
    open,
    onOpenChange,
    defaultUrl,
    initialRules = [],
    onSave,
}: RoutingBuilderMemoryProps) {
    const [rules, setRules] = useState<MemoryRoutingRule[]>(initialRules);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingRule, setEditingRule] = useState<MemoryRoutingRule | null>(null);

    const handleAddRule = () => {
        const newRule: MemoryRoutingRule = {
            name: `Rule ${rules.length + 1}`,
            destinationUrl: defaultUrl,
            priority: rules.length,
            enabled: true,
            conditions: [{ variable: "device.type", operator: "equals", value: "" }],
        };
        setEditingRule(newRule);
        setEditingIndex(-1); // -1 means new rule
    };

    const handleEditRule = (index: number) => {
        setEditingRule({ ...rules[index] });
        setEditingIndex(index);
    };

    const handleDeleteRule = (index: number) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    const handleSaveRule = () => {
        if (!editingRule) return;

        if (editingIndex === -1) {
            // New rule
            setRules([...rules, editingRule]);
        } else if (editingIndex !== null) {
            // Edit existing
            const newRules = [...rules];
            newRules[editingIndex] = editingRule;
            setRules(newRules);
        }

        setEditingRule(null);
        setEditingIndex(null);
    };

    const handleConditionChange = (index: number, field: string, value: string) => {
        if (!editingRule) return;
        const newConditions = [...editingRule.conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        setEditingRule({ ...editingRule, conditions: newConditions });
    };

    const handleAddCondition = () => {
        if (!editingRule) return;
        setEditingRule({
            ...editingRule,
            conditions: [
                ...editingRule.conditions,
                { variable: "device.type", operator: "equals", value: "" },
            ],
        });
    };

    const handleRemoveCondition = (index: number) => {
        if (!editingRule || editingRule.conditions.length <= 1) return;
        setEditingRule({
            ...editingRule,
            conditions: editingRule.conditions.filter((_, i) => i !== index),
        });
    };

    const handleAliasSelect = (variable: string, operator: string, value: string) => {
        if (!editingRule) return;
        if (editingRule.conditions.length === 1 && !editingRule.conditions[0].value) {
            setEditingRule({
                ...editingRule,
                conditions: [{ variable, operator: operator as ConditionOperator, value }],
            });
        } else {
            handleAddCondition();
            const newConditions = [...editingRule.conditions];
            newConditions[newConditions.length - 1] = {
                variable,
                operator: operator as ConditionOperator,
                value,
            };
            setEditingRule({ ...editingRule, conditions: newConditions });
        }
    };

    const handleSaveAll = () => {
        onSave(rules);
        onOpenChange(false);
    };

    return (
        <>
            <Dialog open={open && editingRule === null} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Zap className="size-4" />
                            Smart Routing Rules
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Rules List */}
                        {rules.map((rule, index) => (
                            <div
                                key={index}
                                className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-mono text-muted-foreground">
                                                #{index + 1}
                                            </span>
                                            <h4 className="font-medium">{rule.name}</h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {rule.destinationUrl}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {rule.conditions.map((cond, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs px-2 py-0.5 rounded bg-muted"
                                                >
                                                    {cond.variable} {cond.operator} {cond.value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditRule(index)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteRule(index)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add Rule Button */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddRule}
                            className="w-full"
                        >
                            <Plus className="size-4" />
                            Add Routing Rule
                        </Button>

                        {/* Default URL */}
                        <div className="flex items-center justify-center pt-4">
                            <div className="px-4 py-2 rounded-lg border-2 border-dashed bg-muted/30 text-sm">
                                🔗 Default: {defaultUrl}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveAll}>Save Rules</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Rule Editor Dialog */}
            {editingRule && (
                <Dialog open={true} onOpenChange={() => setEditingRule(null)}>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingIndex === -1 ? "New Rule" : `Edit Rule #${(editingIndex ?? 0) + 1}`}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {/* Rule Name */}
                            <div className="space-y-2">
                                <Label htmlFor="ruleName">Rule Name</Label>
                                <Input
                                    id="ruleName"
                                    value={editingRule.name}
                                    onChange={(e) =>
                                        setEditingRule({ ...editingRule, name: e.target.value })
                                    }
                                    placeholder="e.g., Mobile Users, UK Traffic"
                                />
                            </div>

                            {/* Destination URL */}
                            <div className="space-y-2">
                                <Label htmlFor="destinationUrl">Destination URL</Label>
                                <UrlInput
                                    id="destinationUrl"
                                    value={editingRule.destinationUrl}
                                    onChange={(url) =>
                                        setEditingRule({ ...editingRule, destinationUrl: url })
                                    }
                                    placeholder="example.com/destination"
                                />
                            </div>

                            {/* Quick Add */}
                            <div className="space-y-2">
                                <Label>Quick Add (Popular Conditions)</Label>
                                <RoutingAliasPicker onSelect={handleAliasSelect} />
                            </div>

                            {/* Conditions */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Conditions (ALL must match)</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddCondition}
                                    >
                                        <Plus className="size-3" />
                                        Add Condition
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {editingRule.conditions.map((condition, index) => (
                                        <RoutingConditionRow
                                            key={index}
                                            condition={condition}
                                            onChange={(field, value) =>
                                                handleConditionChange(index, field, value)
                                            }
                                            onRemove={() => handleRemoveCondition(index)}
                                            canRemove={editingRule.conditions.length > 1}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => setEditingRule(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveRule}
                                disabled={
                                    !editingRule.name ||
                                    !editingRule.destinationUrl ||
                                    editingRule.conditions.some((c) => !c.value)
                                }
                            >
                                Save Rule
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
