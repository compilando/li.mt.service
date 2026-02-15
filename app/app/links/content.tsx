"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardHeader, DashboardPageHeader } from "@/components/dashboard/header";
import LinkCreate from "@/components/dashboard/link-create";
import { LinkList } from "@/components/dashboard/link-list";
import { LinksFilter } from "@/components/dashboard/links-filter";
import { LinksDisplay } from "@/components/dashboard/links-display";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Link as LinkIcon } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { getLinks } from "@/lib/actions/links";
import { getTagsByOrganization } from "@/lib/actions/tags";
import type { LinkDisplaySettings, LinkFilters } from "@/lib/validations/links-display";

interface Link {
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
}

export function LinksPageContent() {
    const { activeOrganization } = useActiveOrganization();
    const [links, setLinks] = useState<Link[]>([]);
    const [loading, setLoading] = useState(true);
    const [tags, setTags] = useState<Array<{ id: string; name: string; color: string }>>([]);
    
    // Filters state
    const [filters, setFilters] = useState<LinkFilters>({
        tagIds: [],
        domainIds: [],
        creatorIds: [],
        search: "",
    });

    // Display settings state
    const [displaySettings, setDisplaySettings] = useState<LinkDisplaySettings>({
        viewMode: "cards",
        sortBy: "createdAt",
        sortOrder: "desc",
        showArchived: false,
        displayProperties: {
            shortLink: true,
            destinationUrl: true,
            title: true,
            description: false,
            createdDate: false,
            creator: false,
            tags: true,
            analytics: true,
        },
    });

    const loadLinks = useCallback(() => {
        if (!activeOrganization) return;

        setLoading(true);
        getLinks({
            organizationId: activeOrganization.id,
            page: 1,
            pageSize: 100,
            sortBy: displaySettings.sortBy,
            sortOrder: displaySettings.sortOrder,
        })
            .then((result) => {
                setLinks(result.links);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [activeOrganization, displaySettings.sortBy, displaySettings.sortOrder]);

    // Load tags
    useEffect(() => {
        if (!activeOrganization) return;

        getTagsByOrganization(activeOrganization.id)
            .then((tags) => {
                setTags(tags.map(t => ({ id: t.id, name: t.name, color: t.color })));
            })
            .catch(console.error);
    }, [activeOrganization]);

    useEffect(() => {
        loadLinks();
    }, [loadLinks]);

    if (!activeOrganization) {
        return null;
    }

    return (
        <>
            <DashboardHeader title="Links" icon={LinkIcon} count={links.length}>
                <TooltipProvider>
                    <Tooltip>
                        <LinkCreate organizationId={activeOrganization.id} onSuccess={loadLinks}>
                            <TooltipTrigger asChild>
                                <Button>
                                    <Plus className="size-4" />
                                    New Link
                                </Button>
                            </TooltipTrigger>
                        </LinkCreate>
                        <TooltipContent>
                            <p className="text-xs">Create new link <kbd className="ml-1 px-1 bg-foreground text-background border rounded text-[10px] font-mono">⌘N</kbd></p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </DashboardHeader>

            <div className="flex-1 overflow-auto p-8">
                <DashboardPageHeader
                    title="Links"
                    description="Overview all the links of your organization, create as many as needed to keep your data isolated."
                />

                {/* Filters and Display Controls */}
                <div className="flex items-center gap-2 mb-6">
                    <LinksFilter
                        filters={filters}
                        onFiltersChange={setFilters}
                        availableTags={tags}
                        availableDomains={[]} // TODO: Load domains
                        availableCreators={[]} // TODO: Load creators
                    />
                    <LinksDisplay
                        settings={displaySettings}
                        onSettingsChange={setDisplaySettings}
                    />
                </div>

                {loading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="border rounded-lg p-4 animate-pulse">
                                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                                <div className="h-3 bg-muted rounded w-1/2 mb-1" />
                                <div className="h-3 bg-muted rounded w-2/5" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <LinkList
                        links={links}
                        onUpdate={loadLinks}
                        filters={filters}
                        onFiltersChange={setFilters}
                        displaySettings={displaySettings}
                    />
                )}
            </div>
        </>
    );
}
