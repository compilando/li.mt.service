"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { createDomain } from "@/lib/actions/domains";
import { DomainVerify } from "./domain-verify";
import { toast } from "sonner";

interface DomainCreateProps {
    organizationId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function DomainCreate({ organizationId, open, onOpenChange, onSuccess }: DomainCreateProps) {
    const [domain, setDomain] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdDomain, setCreatedDomain] = useState<{
        id: string;
        name: string;
        verified: boolean;
        verificationToken: string | null;
    } | null>(null);
    const [showVerify, setShowVerify] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const result = await createDomain({
            name: domain.toLowerCase().trim(),
            organizationId,
            type: "custom",
        });

        setLoading(false);

        if (result.success) {
            toast.success("Domain created successfully");
            
            // Prepare domain for verification dialog
            setCreatedDomain({
                id: result.data.id,
                name: domain.toLowerCase().trim(),
                verified: false,
                verificationToken: result.data.verificationToken || null,
            });
            
            // Show verification dialog
            setShowVerify(true);
            onOpenChange(false);
            setDomain("");
        } else {
            setError(result.error);
        }
    };

    const handleVerifySuccess = () => {
        setShowVerify(false);
        setCreatedDomain(null);
        onSuccess?.();
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add custom domain</DialogTitle>
                        <DialogDescription>
                            Add your own domain to use for branded short links
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="domain">Your domain</Label>
                                <Input
                                    id="domain"
                                    placeholder="go.acme.com"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <p className="text-sm text-muted-foreground">
                                    Enter a valid domain to check availability
                                </p>
                            </div>

                            {error && (
                                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading || !domain.trim()}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add domain
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Verification Dialog */}
            {createdDomain && (
                <DomainVerify
                    domain={createdDomain}
                    open={showVerify}
                    onOpenChange={setShowVerify}
                    onSuccess={handleVerifySuccess}
                />
            )}
        </>
    );
}
