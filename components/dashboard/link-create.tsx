"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Globe } from "lucide-react";
import { createLink } from "@/lib/actions/links";
import { LinkForm } from "./link-form";
import { RoutingFlowBuilder } from "./routing-flow-builder";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LinkCreateProps {
  organizationId: string;
  children: React.ReactNode;
  onSuccess?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LinkCreate({ organizationId, children, onSuccess }: LinkCreateProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Smart Routing
  const [routingDialogOpen, setRoutingDialogOpen] = useState(false);
  const [createdLinkId, setCreatedLinkId] = useState<string | null>(null);
  const [createdLinkUrl, setCreatedLinkUrl] = useState<string>("");

  const handleSubmit = async (data: Omit<Parameters<typeof createLink>[0], 'organizationId'>) => {
    setLoading(true);
    setError(null);

    const result = await createLink({
      ...data,
      organizationId,
    });

    setLoading(false);

    if (result.success) {
      setCreatedLinkId(result.data.id);
      setCreatedLinkUrl(data.url);
      setOpen(false);
      toast.success("Link created successfully");
      onSuccess?.();
    } else {
      setError(result.error);
      toast.error(result.error || "Failed to create link");
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setError(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-4xl p-0 gap-0 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Globe className="size-4" />
              New link
            </DialogTitle>
          </DialogHeader>

          {/* Form */}
          <LinkForm
            organizationId={organizationId}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            error={error}
            submitLabel="Create link"
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

      {createdLinkId && (
        <RoutingFlowBuilder
          linkId={createdLinkId}
          open={routingDialogOpen}
          onOpenChange={setRoutingDialogOpen}
          defaultUrl={createdLinkUrl}
        />
      )}
    </>
  );
}
