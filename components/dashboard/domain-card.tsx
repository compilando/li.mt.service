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
    AlertCircle,
    Archive,
    ArchiveRestore,
    Check,
    CheckCircle2,
    Clock,
    ExternalLink,
    Globe,
    MoreHorizontal,
    Settings,
    Trash2,
} from "lucide-react";
import { archiveDomain, deleteDomain } from "@/lib/actions/domains";
import { DomainVerify } from "./domain-verify";
import { toast } from "sonner";

interface DomainCardProps {
    domain: {
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
        _count: { links: number };
    };
    onUpdate?: () => void;
}

export function DomainCard({ domain, onUpdate }: DomainCardProps) {
    const [verifyOpen, setVerifyOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleArchive = async () => {
        const result = await archiveDomain(domain.id, !domain.archived);
        if (result.success) {
            toast.success(domain.archived ? "Domain unarchived" : "Domain archived");
            onUpdate?.();
        } else {
            toast.error(result.error || "Failed to archive domain");
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${domain.name}? This action cannot be undone.`)) {
            return;
        }
        
        setDeleting(true);
        const result = await deleteDomain(domain.id);
        setDeleting(false);
        
        if (result.success) {
            toast.success("Domain deleted successfully");
            onUpdate?.();
        } else {
            toast.error(result.error || "Failed to delete domain");
        }
    };

    const getVerificationBadge = () => {
        if (domain.type === "default") {
            return (
                <Badge variant="outline" className="gap-1 border-green-200 bg-green-50 text-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Default
                </Badge>
            );
        }

        if (domain.verified) {
            return (
                <Badge variant="outline" className="gap-1 border-green-200 bg-green-50 text-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="gap-1 border-yellow-200 bg-yellow-50 text-yellow-700">
                <Clock className="h-3 w-3" />
                Pending verification
            </Badge>
        );
    };

    return (
        <div className={`group border rounded-lg p-4 hover:bg-accent/50 transition-all ${domain.archived ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-4">
                {/* Left: Domain info */}
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                        {domain.logo ? (
                            <img src={domain.logo} alt="" className="h-5 w-5 rounded" />
                        ) : (
                            <Globe className="h-5 w-5 text-muted-foreground" />
                        )}
                        <h3 className="font-semibold text-lg truncate">{domain.name}</h3>
                        {getVerificationBadge()}
                        {domain.archived && (
                            <Badge variant="secondary" className="text-xs">
                                Archived
                            </Badge>
                        )}
                    </div>

                    {domain.description && (
                        <p className="text-sm text-muted-foreground">{domain.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {domain._count.links} {domain._count.links === 1 ? "link" : "links"}
                        </span>
                        {domain.lastCheckedAt && (
                            <span className="flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Last checked {new Date(domain.lastCheckedAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    {!domain.verified && domain.type === "custom" && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVerifyOpen(true)}
                            className="gap-1"
                        >
                            <AlertCircle className="h-3 w-3" />
                            Verify domain
                        </Button>
                    )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {domain.type === "custom" && (
                                <>
                                    <DropdownMenuItem onClick={() => setVerifyOpen(true)}>
                                        <Settings className="h-4 w-4" />
                                        {domain.verified ? "Re-verify" : "Verify domain"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem onClick={handleArchive}>
                                {domain.archived ? (
                                    <>
                                        <ArchiveRestore className="h-4 w-4" />
                                        Unarchive
                                    </>
                                ) : (
                                    <>
                                        <Archive className="h-4 w-4" />
                                        Archive
                                    </>
                                )}
                            </DropdownMenuItem>
                            {domain.type === "custom" && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleDelete}
                                        disabled={deleting || domain._count.links > 0}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Verify Dialog */}
            {domain.type === "custom" && (
                <DomainVerify
                    domain={domain}
                    open={verifyOpen}
                    onOpenChange={setVerifyOpen}
                    onSuccess={onUpdate}
                />
            )}
        </div>
    );
}
