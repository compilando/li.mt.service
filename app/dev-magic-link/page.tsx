"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DevMagicLinkPage() {
    const [links, setLinks] = useState<Array<{ email: string; url: string; timestamp: number }>>([]);

    useEffect(() => {
        // Poll for new magic links
        const interval = setInterval(async () => {
            try {
                const response = await fetch("/api/dev/magic-links");
                if (response.ok) {
                    const data = await response.json();
                    setLinks(data.links || []);
                }
            } catch (error) {
                console.error("Error fetching magic links:", error);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="container mx-auto p-6">
            <Card className="mx-auto max-w-2xl">
                <CardHeader>
                    <CardTitle>🔐 Development Magic Links</CardTitle>
                    <p className="text-muted-foreground text-sm">
                        Magic links generated in development mode appear here
                    </p>
                </CardHeader>
                <CardContent>
                    {links.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No magic links generated yet. Try signing in with your email.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {links.map((link, index) => (
                                <div
                                    key={index}
                                    className="border-border flex flex-col gap-2 rounded-lg border p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{link.email}</span>
                                        <span className="text-muted-foreground text-xs">
                                            {new Date(link.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            window.location.href = link.url;
                                        }}
                                        className="w-full"
                                    >
                                        Click here to sign in →
                                    </Button>
                                    <p className="text-muted-foreground break-all text-xs">
                                        {link.url}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
