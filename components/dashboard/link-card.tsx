"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Copy,
    ExternalLink,
    MoreHorizontal,
    Archive,
    ArchiveRestore,
    Trash2,
    Check,
    Pencil,
} from "lucide-react";
import { deleteLink, archiveLink } from "@/lib/actions/links";
import { APP_URL } from "@/lib/constants";
import { LinkEdit } from "@/components/dashboard/link-edit";
import { toast } from "sonner";
import type { LinkDisplaySettings } from "@/lib/validations/links-display";

interface LinkCardProps {
    link: {
        id: string;
        shortCode: string;
        url: string;
        title: string | null;
        description: string | null;
        archived: boolean;
        createdAt: Date;
        tags: Array<{ tag: { id: string; name: string; color: string } }>;
        _count: { clicks: number };
        domain: { name: string } | null;
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
        organizationId: string;
    };
    onUpdate?: () => void;
    isLast?: boolean;
    displaySettings?: LinkDisplaySettings;
    viewMode?: "cards" | "rows";
}

export function LinkCard({ link, onUpdate, isLast, displaySettings, viewMode = "cards" }: LinkCardProps) {
    const [copied, setCopied] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const shortUrl = `${APP_URL}/r/${link.shortCode}`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("URL copied to clipboard");
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this link? This action cannot be undone.")) return;
        setDeleting(true);
        const result = await deleteLink(link.id);
        setDeleting(false);
        if (result.success) {
            toast.success("Link deleted successfully");
            onUpdate?.();
        } else {
            toast.error(result.error || "Failed to delete link");
        }
    };

    const handleArchive = async () => {
        const result = await archiveLink(link.id, !link.archived);
        if (result.success) {
            toast.success(link.archived ? "Link unarchived" : "Link archived");
            onUpdate?.();
        } else {
            toast.error(result.error || "Failed to archive link");
        }
    };

    const displayUrl = (() => {
        try {
            const url = new URL(link.url);
            return url.hostname + (url.pathname !== "/" ? url.pathname : "");
        } catch {
            return link.url;
        }
    })();

    const faviconUrl = (() => {
        try {
            const url = new URL(link.url);
            return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
        } catch {
            return null;
        }
    })();

    // Row mode for table view
    if (viewMode === "rows") {
        return (
            <tr className="hover:bg-accent/50 transition-all">
                {displaySettings?.displayProperties.shortLink && (
                    <td className="px-4 py-3">
                        <button
                            onClick={handleCopy}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            {copied ? (
                                <Check className="size-3 text-green-600" />
                            ) : (
                                <Copy className="size-3" />
                            )}
                            {link.shortCode}
                        </button>
                    </td>
                )}
                {displaySettings?.displayProperties.destinationUrl && (
                    <td className="px-4 py-3">
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-foreground truncate flex items-center gap-1 max-w-md"
                        >
                            <ExternalLink className="size-3 flex-shrink-0" />
                            <span className="truncate">{displayUrl}</span>
                        </a>
                    </td>
                )}
                {displaySettings?.displayProperties.title && (
                    <td className="px-4 py-3">
                        <span className="text-sm font-medium truncate">
                            {link.title || "-"}
                        </span>
                    </td>
                )}
                {displaySettings?.displayProperties.createdDate && (
                    <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                            {new Date(link.createdAt).toLocaleDateString()}
                        </span>
                    </td>
                )}
                {displaySettings?.displayProperties.tags && (
                    <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                            {link.tags.length > 0 ? (
                                link.tags.map(({ tag }) => (
                                    <Badge
                                        key={tag.id}
                                        variant="outline"
                                        className="text-xs"
                                        style={{ borderColor: tag.color, color: tag.color }}
                                    >
                                        {tag.name}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                            )}
                        </div>
                    </td>
                )}
                {displaySettings?.displayProperties.analytics && (
                    <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold tabular-nums">
                            {link._count.clicks}
                        </span>
                    </td>
                )}
                <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditOpen(true)}>
                                <Pencil className="size-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleCopy}>
                                <Copy className="size-4" />
                                Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href={link.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="size-4" />
                                    Open destination
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleArchive}>
                                {link.archived ? (
                                    <>
                                        <ArchiveRestore className="size-4" />
                                        Unarchive
                                    </>
                                ) : (
                                    <>
                                        <Archive className="size-4" />
                                        Archive
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleDelete}
                                disabled={deleting}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="size-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <LinkEdit
                        link={link}
                        organizationId={link.organizationId}
                        open={editOpen}
                        onOpenChange={setEditOpen}
                        onSuccess={onUpdate}
                    />
                </td>
            </tr>
        );
    }

    // Card mode (default)
    const props = displaySettings?.displayProperties ?? {
        shortLink: true,
        destinationUrl: true,
        title: true,
        description: false,
        createdDate: false,
        creator: false,
        tags: true,
        analytics: true,
    };

    return (
        <div
            className={`group p-4 hover:bg-accent/50 transition-all ${link.archived ? "opacity-60" : ""
                } ${!isLast ? "border-b" : ""}`}
        >
            <div className="flex items-start justify-between gap-4">
                {/* Left side: Link info */}
                <div className="flex-1 min-w-0 space-y-1">
                    {/* Title or short URL */}
                    {props.title && (
                        <div className="flex items-center gap-2">
                            {faviconUrl && (
                                <img
                                    src={faviconUrl}
                                    alt=""
                                    className="size-4 flex-shrink-0 rounded-sm"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            )}
                            <h3 className="font-medium truncate">
                                {link.title || link.shortCode}
                            </h3>
                            {link.archived && (
                                <Badge variant="secondary" className="text-xs">
                                    Archived
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Short URL */}
                    {props.shortLink && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopy}
                                className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                            >
                                {copied ? (
                                    <Check className="size-3 text-green-600" />
                                ) : (
                                    <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                                {shortUrl}
                            </button>
                        </div>
                    )}

                    {/* Destination URL */}
                    {props.destinationUrl && (
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-foreground truncate flex items-center gap-1 max-w-md"
                        >
                            <ExternalLink className="size-3 flex-shrink-0" />
                            <span className="truncate">{displayUrl}</span>
                        </a>
                    )}

                    {/* Description */}
                    {props.description && link.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {link.description}
                        </p>
                    )}

                    {/* Created Date */}
                    {props.createdDate && (
                        <p className="text-xs text-muted-foreground">
                            Created {new Date(link.createdAt).toLocaleDateString()}
                        </p>
                    )}

                    {/* Tags */}
                    {props.tags && link.tags.length > 0 && (
                        <div className="flex gap-1 pt-1">
                            {link.tags.map(({ tag }) => (
                                <Badge
                                    key={tag.id}
                                    variant="outline"
                                    className="text-xs"
                                    style={{ borderColor: tag.color, color: tag.color }}
                                >
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right side: Stats & Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Click count */}
                    {props.analytics && (
                        <div className="text-center relative">
                            <div className="flex items-center justify-center gap-1">
                                <p className="text-lg font-semibold tabular-nums">{link._count.clicks}</p>
                                {link._count.clicks > 0 && (
                                    <span className="absolute -top-1 -right-1 size-2 bg-green-500 rounded-full animate-pulse" />
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">clicks</p>
                        </div>
                    )}

                    {/* Actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditOpen(true)}>
                                <Pencil className="size-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleCopy}>
                                <Copy className="size-4" />
                                Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href={link.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="size-4" />
                                    Open destination
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleArchive}>
                                {link.archived ? (
                                    <>
                                        <ArchiveRestore className="size-4" />
                                        Unarchive
                                    </>
                                ) : (
                                    <>
                                        <Archive className="size-4" />
                                        Archive
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleDelete}
                                disabled={deleting}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="size-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Edit Dialog */}
            <LinkEdit
                link={link}
                organizationId={link.organizationId}
                open={editOpen}
                onOpenChange={setEditOpen}
                onSuccess={onUpdate}
            />
        </div>
    );
}
