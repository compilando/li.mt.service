"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AppError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
                <AlertCircle className="size-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                {error.message || "An unexpected error occurred. Please try again."}
            </p>
            <Button onClick={reset}>Try again</Button>
        </div>
    );
}
