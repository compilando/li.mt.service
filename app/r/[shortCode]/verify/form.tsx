"use client";

import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyLinkPassword } from "@/lib/actions/links";

interface PasswordVerifyFormProps {
    shortCode: string;
}

export default function PasswordVerifyForm({ shortCode }: PasswordVerifyFormProps) {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await verifyLinkPassword(shortCode, password);

        setLoading(false);

        if (result.success) {
            // Redirect to the destination URL
            window.location.href = result.data.url;
        } else {
            setError(result.error);
            setPassword("");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
            <div className="w-full max-w-md">
                <div className="bg-card border rounded-lg shadow-lg p-8 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <Lock className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Password Protected
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                This link requires a password to access
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter the password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoFocus
                                disabled={loading}
                                className="h-11"
                            />
                        </div>

                        {error && (
                            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full h-11"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? "Verifying..." : "Continue"}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="pt-4 border-t">
                        <p className="text-xs text-center text-muted-foreground">
                            Don't have the password? Contact the link owner.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
