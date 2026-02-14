"use client";

import { useState, useCallback, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Zap, Loader2 } from "lucide-react";
import { getRoutingRules, reorderRoutingRules } from "@/lib/actions/routing";
import { RoutingRuleEditor } from "./routing-rule-editor";
import type { RoutingRule, RuleCondition } from "@/generated/prisma/client";

interface RoutingFlowBuilderProps {
    linkId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultUrl: string;
}

type RuleWithConditions = RoutingRule & { conditions: RuleCondition[] };

export function RoutingFlowBuilder({
    linkId,
    open,
    onOpenChange,
    defaultUrl,
}: RoutingFlowBuilderProps) {
    const [rules, setRules] = useState<RuleWithConditions[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRule, setEditingRule] = useState<RuleWithConditions | null>(null);
    const [creatingRule, setCreatingRule] = useState(false);

    const loadRules = useCallback(async () => {
        if (!linkId) return;
        setLoading(true);
        try {
            const data = await getRoutingRules(linkId);
            setRules(data);
        } catch (error) {
            console.error("Error loading rules:", error);
        } finally {
            setLoading(false);
        }
    }, [linkId]);

    useEffect(() => {
        if (open) {
            loadRules();
        }
    }, [open, loadRules]);

    const handleReorder = async (newOrder: RuleWithConditions[]) => {
        setRules(newOrder);
        await reorderRoutingRules({
            linkId,
            ruleIds: newOrder.map((r) => r.id),
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-5xl p-0 gap-0 max-h-[90vh] overflow-hidden">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <Zap className="size-4" />
                            Smart Routing
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Visual Flow */}
                                <div className="space-y-3">
                                    {/* Request Node */}
                                    <div className="flex items-center justify-center">
                                        <div className="px-4 py-2 rounded-lg border-2 border-primary bg-primary/10 font-medium text-sm">
                                            📥 Incoming Request
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex justify-center">
                                        <div className="w-0.5 h-6 bg-border" />
                                    </div>

                                    {/* Rules */}
                                    {rules.map((rule, index) => (
                                        <div key={rule.id}>
                                            <div className="flex items-center gap-3">
                                                {/* Rule Card */}
                                                <div
                                                    className="flex-1 border-2 rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer bg-card"
                                                    onClick={() => setEditingRule(rule)}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs font-mono text-muted-foreground">
                                                                    #{index + 1}
                                                                </span>
                                                                <h4 className="font-medium">
                                                                    {rule.name}
                                                                </h4>
                                                                {rule.weight && (
                                                                    <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                                                                        A/B {rule.weight}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground truncate">
                                                                {rule.destinationUrl}
                                                            </p>
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {rule.conditions.map((cond) => (
                                                                    <span
                                                                        key={cond.id}
                                                                        className="text-xs px-2 py-0.5 rounded bg-muted"
                                                                    >
                                                                        {cond.variable} {cond.operator} {cond.value}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="text-2xl">✓</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            {index < rules.length - 1 && (
                                                <div className="flex justify-center py-2">
                                                    <div className="w-0.5 h-4 bg-border" />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Arrow to default */}
                                    {rules.length > 0 && (
                                        <div className="flex justify-center">
                                            <div className="w-0.5 h-6 bg-border" />
                                        </div>
                                    )}

                                    {/* Default URL */}
                                    <div className="flex items-center justify-center">
                                        <div className="px-4 py-2 rounded-lg border-2 border-dashed bg-muted/30 text-sm">
                                            🔗 Default: {defaultUrl}
                                        </div>
                                    </div>
                                </div>

                                {/* Add Rule Button */}
                                <div className="flex justify-center pt-4">
                                    <Button onClick={() => setCreatingRule(true)} variant="outline">
                                        <Plus className="size-4" />
                                        Add Routing Rule
                                    </Button>
                                </div>

                                {/* Info */}
                                <p className="text-xs text-center text-muted-foreground mt-6">
                                    💡 Rules are evaluated top to bottom. First match wins.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="border-t px-6 py-4 flex justify-end">
                        <Button onClick={() => onOpenChange(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Rule Editor */}
            {(editingRule || creatingRule) && (
                <RoutingRuleEditor
                    linkId={linkId}
                    rule={editingRule}
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingRule(null);
                            setCreatingRule(false);
                        }
                    }}
                    onSuccess={() => {
                        setEditingRule(null);
                        setCreatingRule(false);
                        loadRules();
                    }}
                />
            )}
        </>
    );
}
