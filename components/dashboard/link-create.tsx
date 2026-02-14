"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Globe, Zap } from "lucide-react";
import { createLink } from "@/lib/actions/links";
import { LinkForm } from "./link-form";
import { RoutingBuilderMemory, type MemoryRoutingRule } from "./routing-builder-memory";
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
  const [routingRules, setRoutingRules] = useState<MemoryRoutingRule[]>([]);
  const [formUrl, setFormUrl] = useState<string>("");

  const handleSubmit = async (data: Omit<Parameters<typeof createLink>[0], 'organizationId'>) => {
    setLoading(true);
    setError(null);

    const result = await createLink({
      ...data,
      organizationId,
      routingRules: routingRules.length > 0 ? routingRules : undefined,
    });

    setLoading(false);

    if (result.success) {
      setOpen(false);
      setRoutingRules([]); // Reset routing rules
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
    setRoutingRules([]);
  };

  const handleOpenRouting = () => {
    // Get current URL from form
    const form = document.querySelector('form');
    const urlInput = form?.querySelector('input[id="url"]') as HTMLInputElement;
    if (urlInput?.value) {
      setFormUrl(urlInput.value);
    }
    setRoutingDialogOpen(true);
  };

  const handleSaveRoutingRules = (rules: MemoryRoutingRule[]) => {
    setRoutingRules(rules);
    setRoutingDialogOpen(false);
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
          <div className="border-t px-6 py-4 flex items-center justify-between gap-2 bg-background">
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleOpenRouting}
                className="gap-1.5"
              >
                <Zap className="size-4" />
                Smart Routing
                {routingRules.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                    {routingRules.length}
                  </span>
                )}
              </Button>
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-1.5">
                  {error}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} onClick={(e) => {
                e.preventDefault();
                const form = e.currentTarget.closest('form');
                if (form) {
                  const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                  form.dispatchEvent(submitEvent);
                }
              }}>
                {loading && <span className="mr-2">⏳</span>}
                Create link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Routing Builder */}
      <RoutingBuilderMemory
        open={routingDialogOpen}
        onOpenChange={setRoutingDialogOpen}
        defaultUrl={formUrl}
        initialRules={routingRules}
        onSave={handleSaveRoutingRules}
      />
    </>
  );
}
