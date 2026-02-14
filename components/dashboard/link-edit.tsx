"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Globe } from "lucide-react";
import { updateLink } from "@/lib/actions/links";
import { LinkForm } from "./link-form";
import { RoutingFlowBuilder } from "./routing-flow-builder";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LinkEditProps {
    link: {
        id: string;
        shortCode: string;
        url: string;
        title: string | null;
        description: string | null;
        comments: string | null;
        password: string | null;
        expiresAt: Date | null;
        utmSource: string | null;
        utmMedium: string | null;
        utmCampaign: string | null;
        utmTerm: string | null;
        utmContent: string | null;
        ogTitle: string | null;
        ogDescription: string | null;
        ogImage: string | null;
        tags: Array<{ tag: { id: string; name: string; color: string } }>;
        domain: { name: string } | null;
    };
    organizationId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LinkEdit({ link, organizationId, open, onOpenChange, onSuccess }: LinkEditProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [routingDialogOpen, setRoutingDialogOpen] = useState(false);

    const handleSubmit = async (data: Omit<Parameters<typeof updateLink>[0], 'id'>) => {
        setLoading(true);
        setError(null);

        const result = await updateLink({
            id: link.id,
            ...data,
            // Only update shortCode if it changed
            shortCode: data.shortCode !== link.shortCode ? data.shortCode : undefined,
        });

        setLoading(false);

        if (result.success) {
            onOpenChange(false);
            toast.success("Link updated successfully");
            onSuccess?.();
        } else {
            setError(result.error);
            toast.error(result.error || "Failed to update link");
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
        setError(null);
    };

    // Prepare initial data for the form
    const initialData = {
        url: link.url,
        shortCode: link.shortCode,
        title: link.title || undefined,
        description: link.description || undefined,
        comments: link.comments || undefined,
        password: undefined, // Don't show existing password (it's hashed)
        expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : undefined,
        utmSource: link.utmSource || undefined,
        utmMedium: link.utmMedium || undefined,
        utmCampaign: link.utmCampaign || undefined,
        utmTerm: link.utmTerm || undefined,
        utmContent: link.utmContent || undefined,
        ogTitle: link.ogTitle || undefined,
        ogDescription: link.ogDescription || undefined,
        ogImage: link.ogImage || undefined,
        tags: link.tags,
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-4xl p-0 gap-0 max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <Globe className="size-4" />
                            Edit link
                        </DialogTitle>
                    </DialogHeader>

                    {/* Form */}
                    <LinkForm
                        organizationId={organizationId}
                        initialData={initialData}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        loading={loading}
                        error={error}
                        submitLabel="Update link"
                    />

                    {/* Error & Actions Footer */}
                    <div className="border-t px-6 py-4 flex items-center justify-end gap-2 bg-background">
                        {error && (
                            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-1.5 mr-auto">
                                {error}
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <RoutingFlowBuilder
                linkId={link.id}
                open={routingDialogOpen}
                onOpenChange={setRoutingDialogOpen}
                defaultUrl={link.url}
            />
        </>
    );
}
