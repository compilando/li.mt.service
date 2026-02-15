"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTagsByOrganization, createTag } from "@/lib/actions/tags";
import { getDomains } from "@/lib/actions/domains";
import {
    Link2,
    Loader2,
    MessageSquare,
    QrCode,
    Shuffle,
    Tag,
    X,
    Lock,
    Calendar,
    BarChart3,
    Image as ImageIcon,
    Download,
    Plus,
    Globe,
} from "lucide-react";
import { APP_URL } from "@/lib/constants";
import { QRCodeSVG } from "qrcode.react";
import { generateRandomColor } from "@/lib/url";
import { generateShortCode } from "@/lib/short-code";
import { UrlInput } from "@/components/ui/url-input";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TagOption {
    id: string;
    name: string;
    color: string;
    _count: { links: number };
}

interface DomainOption {
    id: string;
    name: string;
    verified: boolean;
    type: string;
}

type ActiveTab = "utm" | "password" | "expiration" | null;

interface LinkFormProps {
    organizationId: string;
    initialData?: {
        url: string;
        shortCode: string;
        title?: string;
        description?: string;
        comments?: string;
        password?: string;
        expiresAt?: string;
        utmSource?: string;
        utmMedium?: string;
        utmCampaign?: string;
        utmTerm?: string;
        utmContent?: string;
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
        tags?: Array<{ tag: { id: string; name: string; color: string } }>;
        domainId?: string;
        domain?: { id: string; name: string };
    };
    onSubmit: (data: {
        url: string;
        shortCode?: string;
        title?: string;
        description?: string;
        comments?: string;
        password?: string;
        expiresAt?: string;
        utmSource?: string;
        utmMedium?: string;
        utmCampaign?: string;
        utmTerm?: string;
        utmContent?: string;
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
        tagIds?: string[];
        domainId?: string;
    }) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
    error: string | null;
    submitLabel?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LinkForm({
    organizationId,
    initialData,
    onSubmit,
    onCancel,
    loading,
    error,
    submitLabel = "Create link",
}: LinkFormProps) {
    const [activeTab, setActiveTab] = useState<ActiveTab>(null);

    // Tags state
    const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
        initialData?.tags?.map((t) => t.tag.id) || []
    );
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [tagSearch, setTagSearch] = useState("");
    const [creatingTag, setCreatingTag] = useState(false);

    // Domains state
    const [availableDomains, setAvailableDomains] = useState<DomainOption[]>([]);
    const [selectedDomainId, setSelectedDomainId] = useState<string | undefined>(
        initialData?.domainId || undefined
    );

    // Form state - main fields
    const [url, setUrl] = useState(initialData?.url || "");
    const [shortCode, setShortCode] = useState(initialData?.shortCode || "");
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [comments, setComments] = useState(initialData?.comments || "");

    // Form state - protection
    const [password, setPassword] = useState(initialData?.password || "");
    const [expiresAt, setExpiresAt] = useState(initialData?.expiresAt || "");

    // Form state - UTM
    const [utmSource, setUtmSource] = useState(initialData?.utmSource || "");
    const [utmMedium, setUtmMedium] = useState(initialData?.utmMedium || "");
    const [utmCampaign, setUtmCampaign] = useState(initialData?.utmCampaign || "");
    const [utmTerm, setUtmTerm] = useState(initialData?.utmTerm || "");
    const [utmContent, setUtmContent] = useState(initialData?.utmContent || "");

    // Form state - OG Preview
    const [ogTitle, setOgTitle] = useState(initialData?.ogTitle || "");
    const [ogDescription, setOgDescription] = useState(initialData?.ogDescription || "");
    const [ogImage, setOgImage] = useState(initialData?.ogImage || "");

    // ─── Computed ────────────────────────────────────────────────────────────

    const selectedDomain = useMemo(() => {
        return availableDomains.find((d) => d.id === selectedDomainId);
    }, [availableDomains, selectedDomainId]);

    const previewUrl = useMemo(() => {
        if (!url) return "";
        const code = shortCode || "xxxxxxx";
        
        // Use custom domain if selected and verified
        if (selectedDomain && selectedDomain.verified) {
            return `https://${selectedDomain.name}/${code}`;
        }
        
        // Default URL
        return `${APP_URL}/r/${code}`;
    }, [url, shortCode, selectedDomain]);

    const filteredTags = useMemo(() => {
        return availableTags.filter(
            (tag) =>
                !selectedTagIds.includes(tag.id) &&
                tag.name.toLowerCase().includes(tagSearch.toLowerCase())
        );
    }, [availableTags, selectedTagIds, tagSearch]);

    const hasUtmParams = utmSource || utmMedium || utmCampaign || utmTerm || utmContent;
    const hasPassword = password.length > 0;
    const hasExpiration = expiresAt.length > 0;

    // ─── Effects ─────────────────────────────────────────────────────────────

    useEffect(() => {
        getTagsByOrganization(organizationId)
            .then((tags) => setAvailableTags(tags))
            .catch(console.error);
        
        // Load verified domains
        getDomains({
            organizationId,
            type: "all",
            archived: false,
            page: 1,
            pageSize: 100,
        })
            .then((result) => {
                const verifiedDomains = result.domains
                    .filter((d: any) => d.verified)
                    .map((d: any) => ({
                        id: d.id,
                        name: d.name,
                        verified: d.verified,
                        type: d.type,
                    }));
                setAvailableDomains(verifiedDomains);
            })
            .catch(console.error);
    }, [organizationId]);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleGenerateShortCode = () => {
        setShortCode(generateShortCode());
    };

    const handleToggleTag = (tagId: string) => {
        setSelectedTagIds((prev) =>
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        );
        setTagSearch("");
    };

    const handleRemoveTag = (tagId: string) => {
        setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
    };

    const handleTabToggle = (tab: ActiveTab) => {
        setActiveTab((prev) => (prev === tab ? null : tab));
    };

    const handleDownloadQR = () => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");

            const downloadLink = document.createElement("a");
            downloadLink.download = `qr-${shortCode || "code"}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const handleCreateTag = async () => {
        const trimmedName = tagSearch.trim();
        if (!trimmedName || creatingTag) return;

        setCreatingTag(true);
        const result = await createTag({
            name: trimmedName,
            color: generateRandomColor(),
            organizationId,
        });
        setCreatingTag(false);

        if (result.success) {
            const tags = await getTagsByOrganization(organizationId);
            setAvailableTags(tags);
            setSelectedTagIds((prev) => [...prev, result.data.id]);
            setTagSearch("");
            setShowTagDropdown(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            url,
            shortCode: shortCode || undefined,
            title: title || undefined,
            description: description || undefined,
            comments: comments || undefined,
            password: password || undefined,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
            utmSource: utmSource || undefined,
            utmMedium: utmMedium || undefined,
            utmCampaign: utmCampaign || undefined,
            utmTerm: utmTerm || undefined,
            utmContent: utmContent || undefined,
            ogTitle: ogTitle || undefined,
            ogDescription: ogDescription || undefined,
            ogImage: ogImage || undefined,
            tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
            domainId: selectedDomainId || undefined,
        });
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row max-h-[calc(90vh-130px)]">
            {/* ─── Left Panel: Main Form ──────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Destination URL */}
                <div className="space-y-1.5">
                    <Label htmlFor="url" className="flex items-center gap-1.5 text-sm font-medium">
                        Destination URL
                    </Label>
                    <UrlInput
                        id="url"
                        value={url}
                        onChange={setUrl}
                        placeholder="example.com/my-long-url"
                        required
                        autoFocus
                    />
                </div>

                {/* Domain Selector */}
                <div className="space-y-1.5">
                    <Label htmlFor="domain" className="flex items-center gap-1.5 text-sm font-medium">
                        <Globe className="size-3.5" />
                        Domain
                    </Label>
                    <Select value={selectedDomainId || "default"} onValueChange={(value) => setSelectedDomainId(value === "default" ? undefined : value)}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select domain" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">
                                <div className="flex items-center gap-2">
                                    <Link2 className="size-3.5" />
                                    <span>{APP_URL.replace(/^https?:\/\//, "")}</span>
                                    <Badge variant="secondary" className="text-[10px] px-1">Default</Badge>
                                </div>
                            </SelectItem>
                            {availableDomains.map((domain) => (
                                <SelectItem key={domain.id} value={domain.id}>
                                    <div className="flex items-center gap-2">
                                        <Globe className="size-3.5" />
                                        <span>{domain.name}</span>
                                        {domain.type === "default" && (
                                            <Badge variant="secondary" className="text-[10px] px-1">Branded</Badge>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Short Link */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="shortCode" className="flex items-center gap-1.5 text-sm font-medium">
                            Short Code
                        </Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground"
                            onClick={handleGenerateShortCode}
                            title="Generate random code"
                        >
                            <Shuffle className="size-3" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-0">
                        <div className="flex items-center h-9 px-3 rounded-l-md border border-r-0 bg-muted text-sm text-muted-foreground whitespace-nowrap overflow-hidden">
                            <Link2 className="size-3.5 mr-1.5 flex-shrink-0" />
                            <span className="truncate">
                                {selectedDomain && selectedDomain.verified 
                                    ? `${selectedDomain.name}/`
                                    : `${APP_URL.replace(/^https?:\/\//, "")}/r/`
                                }
                            </span>
                        </div>
                        <Input
                            id="shortCode"
                            placeholder="auto-generated"
                            value={shortCode}
                            onChange={(e) => setShortCode(e.target.value)}
                            pattern="^[a-zA-Z0-9_-]+$"
                            className="h-9 rounded-l-none"
                        />
                    </div>
                </div>

                {/* Title & Description in 2 columns */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="title" className="text-sm font-medium">
                            Title
                        </Label>
                        <Input
                            id="title"
                            placeholder="Link title (optional)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-9"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-sm font-medium">
                            Description
                        </Label>
                        <Input
                            id="description"
                            placeholder="Brief description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="h-9"
                        />
                    </div>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-1.5 text-sm font-medium">
                            <Tag className="size-3.5" />
                            Tags
                        </Label>
                    </div>

                    {/* Selected tags */}
                    <div className="relative">
                        <div
                            className="flex flex-wrap items-center gap-1.5 min-h-10 px-3 py-2 rounded-md border cursor-text"
                            onClick={() => setShowTagDropdown(true)}
                        >
                            {selectedTagIds.map((tagId) => {
                                const tag = availableTags.find((t) => t.id === tagId);
                                if (!tag) return null;
                                return (
                                    <Badge
                                        key={tag.id}
                                        variant="outline"
                                        className="text-xs gap-1 pr-1"
                                        style={{ borderColor: tag.color, color: tag.color }}
                                    >
                                        {tag.name}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveTag(tag.id);
                                            }}
                                            className="hover:bg-muted rounded-sm p-0.5"
                                        >
                                            <X className="size-2.5" />
                                        </button>
                                    </Badge>
                                );
                            })}
                            <input
                                type="text"
                                placeholder={selectedTagIds.length === 0 ? "Select tags..." : ""}
                                value={tagSearch}
                                onChange={(e) => {
                                    setTagSearch(e.target.value);
                                    setShowTagDropdown(true);
                                }}
                                onFocus={() => setShowTagDropdown(true)}
                                className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            />
                        </div>

                        {/* Tag dropdown */}
                        {showTagDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowTagDropdown(false)}
                                />
                                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
                                    {filteredTags.length === 0 && !tagSearch.trim() ? (
                                        <p className="px-3 py-2 text-sm text-muted-foreground">
                                            No tags created yet
                                        </p>
                                    ) : (
                                        <>
                                            {filteredTags.map((tag) => (
                                                <button
                                                    key={tag.id}
                                                    type="button"
                                                    onClick={() => {
                                                        handleToggleTag(tag.id);
                                                        setShowTagDropdown(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                                                >
                                                    <span
                                                        className="size-2.5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: tag.color }}
                                                    />
                                                    <span className="flex-1">{tag.name}</span>
                                                    <span className="text-xs text-muted-foreground">{tag._count.links}</span>
                                                </button>
                                            ))}
                                            {tagSearch.trim() && (
                                                <button
                                                    type="button"
                                                    onClick={handleCreateTag}
                                                    disabled={creatingTag}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left border-t"
                                                >
                                                    {creatingTag ? (
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                    ) : (
                                                        <Plus className="size-3.5" />
                                                    )}
                                                    <span className="flex-1">
                                                        Create &ldquo;{tagSearch.trim()}&rdquo;
                                                    </span>
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>


                {/* Comments - Single line for compactness */}
                <div className="space-y-1.5">
                    <Label htmlFor="comments" className="flex items-center gap-1.5 text-sm font-medium">
                        <MessageSquare className="size-3.5" />
                        Internal Notes
                    </Label>
                    <Input
                        id="comments"
                        placeholder="Add internal notes..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="h-9"
                    />
                </div>


                {/* ─── Feature Tabs ─────────────────────────────────────────── */}
                <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Button
                            type="button"
                            variant={activeTab === "utm" ? "default" : "outline"}
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => handleTabToggle("utm")}
                        >
                            <BarChart3 className="size-3.5" />
                            UTM
                            {hasUtmParams && activeTab !== "utm" && (
                                <span className="size-1.5 rounded-full bg-primary" />
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant={activeTab === "password" ? "default" : "outline"}
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => handleTabToggle("password")}
                        >
                            <Lock className="size-3.5" />
                            Password
                            {hasPassword && activeTab !== "password" && (
                                <span className="size-1.5 rounded-full bg-primary" />
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant={activeTab === "expiration" ? "default" : "outline"}
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => handleTabToggle("expiration")}
                        >
                            <Calendar className="size-3.5" />
                            Expiration
                            {hasExpiration && activeTab !== "expiration" && (
                                <span className="size-1.5 rounded-full bg-primary" />
                            )}
                        </Button>
                    </div>

                    {/* UTM Panel */}
                    {activeTab === "utm" && (
                        <div className="space-y-2.5 rounded-lg border p-3 bg-muted/30">
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <Label htmlFor="utmSource" className="text-xs">
                                        Source
                                    </Label>
                                    <Input
                                        id="utmSource"
                                        placeholder="google"
                                        value={utmSource}
                                        onChange={(e) => setUtmSource(e.target.value)}
                                        className="h-8"
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
                                        className="h-8"
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
                                    className="h-8"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <Label htmlFor="utmTerm" className="text-xs">
                                        Term
                                    </Label>
                                    <Input
                                        id="utmTerm"
                                        placeholder="running+shoes"
                                        value={utmTerm}
                                        onChange={(e) => setUtmTerm(e.target.value)}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="utmContent" className="text-xs">
                                        Content
                                    </Label>
                                    <Input
                                        id="utmContent"
                                        placeholder="logolink"
                                        value={utmContent}
                                        onChange={(e) => setUtmContent(e.target.value)}
                                        className="h-8"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Password Panel */}
                    {activeTab === "password" && (
                        <div className="space-y-2.5 rounded-lg border p-3 bg-muted/30">
                            <div className="space-y-1">
                                <Label htmlFor="password" className="text-xs">
                                    Password protection
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter a password to protect this link"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-8"
                                />
                            </div>
                        </div>
                    )}

                    {/* Expiration Panel */}
                    {activeTab === "expiration" && (
                        <div className="space-y-2.5 rounded-lg border p-3 bg-muted/30">
                            <div className="space-y-1">
                                <Label htmlFor="expiresAt" className="text-xs">
                                    Expiration date
                                </Label>
                                <Input
                                    id="expiresAt"
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    className="h-8"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Right Panel: Sidebar ──────────────────────────────────── */}
            <div className="w-full sm:w-80 border-t sm:border-t-0 sm:border-l overflow-y-auto bg-muted/20 p-4 space-y-4">
                {/* QR Code - More compact */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-1.5 text-sm font-medium">
                            <QrCode className="size-3.5" />
                            QR Code
                        </Label>
                        {url && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-muted-foreground"
                                onClick={handleDownloadQR}
                                title="Download QR code"
                            >
                                <Download className="size-3" />
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center justify-center rounded-lg border bg-white p-3">
                        {url ? (
                            <QRCodeSVG
                                id="qr-code-svg"
                                value={previewUrl}
                                size={120}
                                level="M"
                                includeMargin={false}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[120px] text-muted-foreground">
                                <QrCode className="size-8 mb-1.5 opacity-30" />
                                <p className="text-xs text-center">
                                    Enter a URL to<br />generate QR
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Custom Link Preview (OG) */}
                <div className="space-y-2.5">
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                        <ImageIcon className="size-3.5" />
                        Social Preview
                    </Label>

                    {/* OG Preview Card - Smaller */}
                    <div className="rounded-lg border bg-white overflow-hidden">
                        {ogImage ? (
                            <div className="aspect-[2/1] bg-muted flex items-center justify-center overflow-hidden">
                                <img
                                    src={ogImage}
                                    alt="OG preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="aspect-[2/1] bg-muted/50 flex flex-col items-center justify-center text-muted-foreground">
                                <ImageIcon className="size-6 opacity-30" />
                            </div>
                        )}
                        <div className="p-2.5 space-y-0.5">
                            <p className="text-xs font-medium truncate">
                                {ogTitle || title || "Add a title..."}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                                {ogDescription || description || "Add a description..."}
                            </p>
                        </div>
                    </div>

                    {/* OG Fields */}
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <Label htmlFor="ogTitle" className="text-xs">
                                OG Title
                            </Label>
                            <Input
                                id="ogTitle"
                                placeholder={title || "Custom title for social media"}
                                value={ogTitle}
                                onChange={(e) => setOgTitle(e.target.value)}
                                className="h-8"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="ogDescription" className="text-xs">
                                OG Description
                            </Label>
                            <Textarea
                                id="ogDescription"
                                placeholder={description || "Custom description for social media"}
                                value={ogDescription}
                                onChange={(e) => setOgDescription(e.target.value)}
                                rows={2}
                                className="resize-none text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="ogImage" className="text-xs">
                                Image URL
                            </Label>
                            <UrlInput
                                id="ogImage"
                                value={ogImage}
                                onChange={setOgImage}
                                placeholder="example.com/image.png"
                                className="h-8"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Footer ────────────────────────────────────────────────── */}
            {/* Hidden footer for form submission - rendered by parent */}
            <div className="hidden">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading || !url}>
                        {loading && <Loader2 className="size-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </div>
            </div>
        </form>
    );
}
