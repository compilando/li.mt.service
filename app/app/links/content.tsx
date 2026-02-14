"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import LinkCreate from "@/components/dashboard/link-create";
import { LinkList } from "@/components/dashboard/link-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { getLinks } from "@/lib/actions/links";

export function LinksPageContent() {
    const { activeOrganization } = useActiveOrganization();
    const [links, setLinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeOrganization) return;

        setLoading(true);
        getLinks({
            organizationId: activeOrganization.id,
            page: 1,
            pageSize: 50,
            sortBy: "createdAt",
            sortOrder: "desc",
        })
            .then((result) => {
                setLinks(result.links);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [activeOrganization]);

    if (!activeOrganization) {
        return null;
    }

    return (
        <>
            <DashboardHeader title="Links">
                <LinkCreate organizationId={activeOrganization.id}>
                    <Button>
                        <Plus className="size-4" />
                        New Link
                    </Button>
                </LinkCreate>
            </DashboardHeader>

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
                <LinkList links={links} />
            )}
        </>
    );
}
