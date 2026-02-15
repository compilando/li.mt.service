"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Copy, Loader2, RefreshCw } from "lucide-react";
import { verifyDomain } from "@/lib/actions/domains";
import { toast } from "sonner";

interface DomainVerifyProps {
    domain: {
        id: string;
        name: string;
        verified: boolean;
        verificationToken: string | null;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function DomainVerify({ domain, open, onOpenChange, onSuccess }: DomainVerifyProps) {
    const [verifying, setVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);

    const handleVerify = async () => {
        setVerifying(true);
        setVerificationError(null);

        const result = await verifyDomain(domain.id);

        if (result.success) {
            toast.success("Domain verified successfully!");
            onSuccess?.();
            onOpenChange(false);
        } else {
            setVerificationError(result.error);
        }

        setVerifying(false);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    if (!domain.verificationToken) {
        return null;
    }

    const txtRecordName = `_limt-challenge.${domain.name}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Verify {domain.name}
                        {domain.verified && (
                            <Badge variant="outline" className="gap-1 border-green-200 bg-green-50 text-green-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Verified
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Add the following DNS records to verify ownership of your domain
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Step 1: TXT Record */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                1
                            </span>
                            <h4 className="font-semibold">Add TXT record</h4>
                        </div>

                        <div className="ml-8 space-y-2">
                            <div className="grid grid-cols-4 gap-2 text-sm">
                                <div className="font-medium text-muted-foreground">Type:</div>
                                <div className="col-span-3 font-mono">TXT</div>
                                
                                <div className="font-medium text-muted-foreground">Name:</div>
                                <div className="col-span-3 flex items-center gap-2">
                                    <code className="flex-1 rounded bg-muted px-2 py-1 text-xs">
                                        {txtRecordName}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7"
                                        onClick={() => handleCopy(txtRecordName)}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>

                                <div className="font-medium text-muted-foreground">Value:</div>
                                <div className="col-span-3 flex items-center gap-2">
                                    <code className="flex-1 rounded bg-muted px-2 py-1 text-xs break-all">
                                        {domain.verificationToken}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7"
                                        onClick={() => handleCopy(domain.verificationToken!)}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>

                                <div className="font-medium text-muted-foreground">TTL:</div>
                                <div className="col-span-3 font-mono">3600</div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: CNAME Record (Optional) */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                                2
                            </span>
                            <h4 className="font-semibold">Add CNAME record (Optional)</h4>
                        </div>

                        <div className="ml-8 space-y-2">
                            <p className="text-sm text-muted-foreground mb-2">
                                For production traffic routing, add this CNAME record:
                            </p>
                            <div className="grid grid-cols-4 gap-2 text-sm">
                                <div className="font-medium text-muted-foreground">Type:</div>
                                <div className="col-span-3 font-mono">CNAME</div>
                                
                                <div className="font-medium text-muted-foreground">Name:</div>
                                <div className="col-span-3 flex items-center gap-2">
                                    <code className="flex-1 rounded bg-muted px-2 py-1 text-xs">
                                        {domain.name}
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7"
                                        onClick={() => handleCopy(domain.name)}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>

                                <div className="font-medium text-muted-foreground">Value:</div>
                                <div className="col-span-3 flex items-center gap-2">
                                    <code className="flex-1 rounded bg-muted px-2 py-1 text-xs">
                                        cname.limt.app
                                    </code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7"
                                        onClick={() => handleCopy("cname.limt.app")}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>

                                <div className="font-medium text-muted-foreground">TTL:</div>
                                <div className="col-span-3 font-mono">3600</div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Verify */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                3
                            </span>
                            <h4 className="font-semibold">Verify domain</h4>
                        </div>

                        <div className="ml-8 space-y-3">
                            <p className="text-sm text-muted-foreground">
                                After adding the DNS records, click the button below to verify. DNS propagation can take up to 24 hours.
                            </p>

                            {verificationError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{verificationError}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                onClick={handleVerify}
                                disabled={verifying}
                                className="w-full"
                            >
                                {verifying ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Verify Domain
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Help text */}
                    <Alert>
                        <AlertDescription className="text-sm">
                            <strong>Need help?</strong> DNS changes can take time to propagate. If verification fails,
                            wait a few minutes and try again. Make sure you've added the TXT record exactly as shown above.
                        </AlertDescription>
                    </Alert>
                </div>
            </DialogContent>
        </Dialog>
    );
}
