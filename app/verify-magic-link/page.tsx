"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function VerifyMagicLink() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const verifyToken = async () => {
            const token = searchParams.get("token");
            const callbackURL = searchParams.get("callbackURL") || "/app";

            if (!token) {
                setStatus("error");
                setError("No verification token provided");
                return;
            }

            try {
                // Call Better Auth's verify endpoint using GET (as Better Auth expects)
                const verifyUrl = `/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`;

                const response = await fetch(verifyUrl, {
                    method: "GET",
                    credentials: "include", // Important for cookies
                });

                if (response.ok) {
                    setStatus("success");
                    // Wait a moment for cookies to be set, then redirect
                    setTimeout(() => {
                        window.location.href = callbackURL;
                    }, 1000);
                } else {
                    const text = await response.text();
                    console.error("Verification failed:", response.status, text);
                    setStatus("error");
                    setError(`Verification failed (${response.status})`);
                }
            } catch (err) {
                console.error("Verification error:", err);
                setStatus("error");
                setError("An error occurred during verification");
            }
        };

        verifyToken();
    }, [searchParams, router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                {status === "verifying" && (
                    <div>
                        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                        <p className="text-lg">Verifying your magic link...</p>
                    </div>
                )}
                {status === "success" && (
                    <div>
                        <p className="text-lg text-green-600">✓ Verified! Redirecting...</p>
                    </div>
                )}
                {status === "error" && (
                    <div>
                        <p className="text-lg text-red-600">✗ Verification failed</p>
                        <p className="mt-2 text-sm text-gray-600">{error}</p>
                        <button
                            onClick={() => router.push("/signin")}
                            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                        >
                            Return to Sign In
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
