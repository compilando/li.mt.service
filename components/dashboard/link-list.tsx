"use client";

import { LinkCard } from "@/components/dashboard/link-card";
import { Input } from "@/components/ui/input";
import { Search, LinkIcon } from "lucide-react";
import { useState, useMemo } from "react";

interface LinkListProps {
    links: Array<{
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
    }>;
}

export function LinkList({ links }: LinkListProps) {
    const [search, setSearch] = useState("");

    const filteredLinks = useMemo(() => {
        if (!search) return links;
        const q = search.toLowerCase();
        return links.filter(
            (link) =>
                link.url.toLowerCase().includes(q) ||
                link.shortCode.toLowerCase().includes(q) ||
                link.title?.toLowerCase().includes(q),
        );
    }, [links, search]);

    return (
        <div className="space-y-4">
            {/* Search */}
            {links.length > 0 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search links..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            )}

            {/* Links */}
            {filteredLinks.length > 0 ? (
                <div className="space-y-2">
                    {filteredLinks.map((link) => (
                        <LinkCard key={link.id} link={link} />
                    ))}
                </div>
            ) : links.length > 0 ? (
                <EmptyState
                    title="No links found"
                    description="Try adjusting your search terms"
                />
            ) : (
                <EmptyState
                    title="No links yet"
                    description="Create your first short link to get started"
                />
            )}
        </div>
    );
}

function EmptyState({ title, description }: { title: string; description: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
                <LinkIcon className="size-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg">{title}</h3>
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
        </div>
    );
}
