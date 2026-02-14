import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
            <div className="rounded-full bg-muted p-4 mb-4">
                <FileQuestion className="size-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Page not found</h1>
            <p className="text-muted-foreground mb-6">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Button asChild>
                <Link href="/">Go home</Link>
            </Button>
        </div>
    );
}
