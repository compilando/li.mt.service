"use client";

import { LinkCard } from "@/components/dashboard/link-card";
import { Input } from "@/components/ui/input";
import { Search, LinkIcon } from "lucide-react";
import { useState, useMemo } from "react";
import type { LinkDisplaySettings, LinkFilters } from "@/lib/validations/links-display";

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
    }>;
    onUpdate?: () => void;
    filters: LinkFilters;
    onFiltersChange: (filters: LinkFilters) => void;
    displaySettings: LinkDisplaySettings;
}

export function LinkList({ links, onUpdate, filters, onFiltersChange, displaySettings }: LinkListProps) {
    const filteredLinks = useMemo(() => {
        let result = links;

        // Apply search filter
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(
                (link) =>
                    link.url.toLowerCase().includes(q) ||
                    link.shortCode.toLowerCase().includes(q) ||
                    link.title?.toLowerCase().includes(q),
            );
        }

        // Apply tag filter
        if (filters.tagIds.length > 0) {
            result = result.filter((link) =>
                link.tags.some((lt) => filters.tagIds.includes(lt.tag.id))
            );
        }

        // Apply domain filter
        if (filters.domainIds.length > 0) {
            result = result.filter((link) =>
                link.domain && filters.domainIds.includes(link.domain.name)
            );
        }

        // Apply archived filter from display settings
        if (!displaySettings.showArchived) {
            result = result.filter((link) => !link.archived);
        }

        return result;
    }, [links, filters, displaySettings.showArchived]);

    return (
        <div className="space-y-4">
            {/* Search */}
            {links.length > 0 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search links..."
                        value={filters.search}
                        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                        className="pl-9"
                    />
                </div>
            )}

            {/* Links */}
            {filteredLinks.length > 0 ? (
                displaySettings.viewMode === "cards" ? (
                    <div className="border rounded-lg overflow-hidden">
                        {filteredLinks.map((link, index) => (
                            <LinkCard
                                key={link.id}
                                link={link}
                                onUpdate={onUpdate}
                                isLast={index === filteredLinks.length - 1}
                                displaySettings={displaySettings}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        {displaySettings.displayProperties.shortLink && (
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Short Link
                                            </th>
                                        )}
                                        {displaySettings.displayProperties.destinationUrl && (
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Destination
                                            </th>
                                        )}
                                        {displaySettings.displayProperties.title && (
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Title
                                            </th>
                                        )}
                                        {displaySettings.displayProperties.createdDate && (
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Created
                                            </th>
                                        )}
                                        {displaySettings.displayProperties.tags && (
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Tags
                                            </th>
                                        )}
                                        {displaySettings.displayProperties.analytics && (
                                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Clicks
                                            </th>
                                        )}
                                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredLinks.map((link) => (
                                        <LinkCard
                                            key={link.id}
                                            link={link}
                                            onUpdate={onUpdate}
                                            displaySettings={displaySettings}
                                            viewMode="rows"
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
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
