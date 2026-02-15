"use client";

import { useEffect, useState } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { DashboardHeader } from "@/components/dashboard/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Plus, Search } from "lucide-react";
import { getDomains } from "@/lib/actions/domains";
import { DomainCard } from "@/components/dashboard/domain-card";
import { DomainCreate } from "@/components/dashboard/domain-create";
import { Badge } from "@/components/ui/badge";

type Domain = {
    id: string;
    name: string;
    verified: boolean;
    archived: boolean;
    type: string;
    verificationToken: string | null;
    lastCheckedAt: Date | null;
    notFoundUrl: string | null;
    expiredUrl: string | null;
    placeholder: string | null;
    logo: string | null;
    description: string | null;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
    _count: { links: number };
};

export function DomainsPageContent() {
    const { activeOrganization } = useActiveOrganization();
    const [customDomains, setCustomDomains] = useState<Domain[]>([]);
    const [defaultDomains, setDefaultDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showArchived, setShowArchived] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const loadDomains = async () => {
        if (!activeOrganization) return;
        
        setLoading(true);
        
        try {
            // Load custom domains
            const customResult = await getDomains({
                organizationId: activeOrganization.id,
                type: "custom",
                archived: showArchived ? undefined : false,
                search: search || undefined,
                page: 1,
                pageSize: 50,
            });
            
            // Load default domains
            const defaultResult = await getDomains({
                organizationId: activeOrganization.id,
                type: "default",
                archived: false, // Default domains are never archived
                page: 1,
                pageSize: 50,
            });
            
            setCustomDomains(customResult.domains as any);
            setDefaultDomains(defaultResult.domains as any);
        } catch (error) {
            console.error("Error loading domains:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDomains();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeOrganization, showArchived, search]);

    if (!activeOrganization) {
        return (
            <>
                <DashboardHeader title="Domains" icon={Globe} />
                <div className="flex-1 overflow-auto p-8">
                    <p className="text-sm text-muted-foreground">No organization selected</p>
                </div>
            </>
        );
    }

    return (
        <>
            <DashboardHeader title="Domains" icon={Globe}>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add custom domain
                </Button>
            </DashboardHeader>

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Banner: Claim free .link domain */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 dark:bg-green-900 rounded-full p-2">
                                <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-medium text-green-900 dark:text-green-100">
                                    Claim a free .link domain, free for 1 year.
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Get your branded short domain with a .link extension
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" className="border-green-300 dark:border-green-700">
                            Claim Domain
                        </Button>
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="custom" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 max-w-md">
                            <TabsTrigger value="custom">
                                Custom domains
                                {customDomains.length > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {customDomains.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="default">
                                Default domains
                                {defaultDomains.length > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {defaultDomains.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        {/* Custom Domains Tab */}
                        <TabsContent value="custom" className="space-y-4 mt-6">
                            {/* Search & Filters */}
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search domains..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant={showArchived ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setShowArchived(!showArchived)}
                                    >
                                        {showArchived ? "Active" : "Archived"}
                                    </Button>
                                </div>
                            </div>

                            {/* Domains List */}
                            {loading ? (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">Loading domains...</p>
                                </div>
                            ) : customDomains.length === 0 ? (
                                <div className="text-center py-12 border rounded-lg bg-muted/20">
                                    <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <h3 className="text-lg font-semibold mb-2">No custom domains found</h3>
                                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                                        Use custom domains for better brand recognition and click-through rates
                                    </p>
                                    <Button onClick={() => setCreateDialogOpen(true)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Domain
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {customDomains.map((domain) => (
                                        <DomainCard
                                            key={domain.id}
                                            domain={domain}
                                            onUpdate={loadDomains}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Default Domains Tab */}
                        <TabsContent value="default" className="space-y-4 mt-6">
                            <div className="bg-muted/30 rounded-lg border p-4 mb-4">
                                <p className="text-sm text-muted-foreground">
                                    Leverage default branded domains from Dub for specific links. Learn more.
                                </p>
                            </div>

                            {defaultDomains.length === 0 ? (
                                <div className="text-center py-12 border rounded-lg bg-muted/20">
                                    <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <h3 className="text-lg font-semibold mb-2">No default domains available</h3>
                                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                        Default branded domains will appear here when they are added to your organization
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {defaultDomains.map((domain) => (
                                        <DomainCard
                                            key={domain.id}
                                            domain={domain}
                                            onUpdate={loadDomains}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Create Domain Dialog */}
            <DomainCreate
                organizationId={activeOrganization.id}
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={loadDomains}
            />
        </>
    );
}
