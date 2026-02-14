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
} from "lucide-react";
import { deleteLink, archiveLink } from "@/lib/actions/links";
import { APP_URL } from "@/lib/constants";

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
    };
}

export function LinkCard({ link }: LinkCardProps) {
    const [copied, setCopied] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const shortUrl = `${APP_URL}/r/${link.shortCode}`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this link? This action cannot be undone.")) return;
        setDeleting(true);
        await deleteLink(link.id);
        setDeleting(false);
    };

    const handleArchive = async () => {
        await archiveLink(link.id, !link.archived);
    };

    const displayUrl = (() => {
        try {
            const url = new URL(link.url);
            return url.hostname + (url.pathname !== "/" ? url.pathname : "");
        } catch {
            return link.url;
        }
    })();

    return (
        <div
            className={`group border rounded-lg p-4 hover:shadow-sm transition-all ${link.archived ? "opacity-60" : ""
                }`}
        >
            <div className="flex items-start justify-between gap-4">
                {/* Left side: Link info */}
                <div className="flex-1 min-w-0 space-y-1">
                    {/* Title or short URL */}
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">
                            {link.title || link.shortCode}
                        </h3>
                        {link.archived && (
                            <Badge variant="secondary" className="text-xs">
                                Archived
                            </Badge>
                        )}
                    </div>

                    {/* Short URL */}
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

                    {/* Destination URL */}
                    <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground truncate flex items-center gap-1 max-w-md"
                    >
                        <ExternalLink className="size-3 flex-shrink-0" />
                        <span className="truncate">{displayUrl}</span>
                    </a>

                    {/* Tags */}
                    {link.tags.length > 0 && (
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
                    <div className="text-center">
                        <p className="text-lg font-semibold">{link._count.clicks}</p>
                        <p className="text-xs text-muted-foreground">clicks</p>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
        </div>
    );
}
