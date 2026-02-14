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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLink } from "@/lib/actions/links";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { APP_URL } from "@/lib/constants";

interface LinkCreateProps {
  organizationId: string;
  children: React.ReactNode;
}

export default function LinkCreate({ organizationId, children }: LinkCreateProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form state
  const [url, setUrl] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");

  const resetForm = () => {
    setUrl("");
    setShortCode("");
    setTitle("");
    setDescription("");
    setUtmSource("");
    setUtmMedium("");
    setUtmCampaign("");
    setError(null);
    setShowAdvanced(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createLink({
      url,
      shortCode: shortCode || undefined,
      title: title || undefined,
      description: description || undefined,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
      organizationId,
    });

    setLoading(false);

    if (result.success) {
      resetForm();
      setOpen(false);
    } else {
      setError(result.error);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create new link</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Destination URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Destination URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/my-long-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Short Code */}
          <div className="space-y-2">
            <Label htmlFor="shortCode">
              Short code <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                {APP_URL}/r/
              </span>
              <Input
                id="shortCode"
                placeholder="auto-generated"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                pattern="^[a-zA-Z0-9_-]+$"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="title"
              placeholder="My awesome link"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            Advanced options
          </button>

          {showAdvanced && (
            <div className="space-y-4 border-t pt-4">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A brief description of this link"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {/* UTM Parameters */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  UTM Parameters
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="utmSource" className="text-xs">
                      Source
                    </Label>
                    <Input
                      id="utmSource"
                      placeholder="google"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="utmMedium" className="text-xs">
                      Medium
                    </Label>
                    <Input
                      id="utmMedium"
                      placeholder="cpc"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="utmCampaign" className="text-xs">
                    Campaign
                  </Label>
                  <Input
                    id="utmCampaign"
                    placeholder="spring_sale"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !url}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Create link
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
