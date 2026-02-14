import { NextResponse } from "next/server";

// In-memory storage for development only
// DO NOT use this in production
const magicLinks: Array<{ email: string; url: string; timestamp: number }> = [];

export async function GET() {
    // Only allow in development
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Not available in production" }, { status: 403 });
    }

    return NextResponse.json({ links: magicLinks.slice(-10) }); // Return last 10 links
}

export async function POST(request: Request) {
    // Only allow in development
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Not available in production" }, { status: 403 });
    }

    const body = await request.json();
    const { email, url } = body;

    if (!email || !url) {
        return NextResponse.json({ error: "Missing email or url" }, { status: 400 });
    }

    // Add to in-memory storage
    magicLinks.push({
        email,
        url,
        timestamp: Date.now(),
    });

    // Keep only last 10
    if (magicLinks.length > 10) {
        magicLinks.shift();
    }

    return NextResponse.json({ success: true });
}
