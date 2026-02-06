"use client";

import Link from "next/link";
import { apiFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { useRef } from "react";

type Props = { token?: string; email?: string };

export default function VerifyEmailClient({ token, email }: Props) {
    // Use a ref to ensure we only verify once per session, even in Strict Mode
    const hasCalled = useRef(false);

    // Only run the query if we actually have a token
    const { data, loading } = useApiQuery(
        () => {
            if (!token || hasCalled.current) return Promise.resolve(null);
            hasCalled.current = true;
            return apiFetch<{ ok: true }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        },
        [token]
    );

    // Helper to determine the UI state clearly
    const isVerifying = !!token && loading;
    const isSuccess = !!data;
    const isError = !isSuccess;
    const isWaitingForUser = !token; // User just signed up, needs to click email

    // Dynamic Content Mapping
    const content = {
        verifying: {
            title: "Verifying email...",
            desc: "This should only take a second.",
        },
        success: {
            title: "Email verified",
            desc: "Your account is verified, you can sign in now.",
        },
        error: {
            title: "Verification failed",
            desc: "The verification link is invalid or expired.",
        },
        waiting: {
            title: "Check your inbox",
            desc: "We sent you a verification link. Open it to activate your account.",
        },
    };

    const current = isVerifying ? content.verifying
        : isSuccess ? content.success
            : isError ? content.error
                : content.waiting;

    return (
        <Card className="w-full max-w-md shadow-sm">
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">{current.title}</CardTitle>
                <CardDescription>{current.desc}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {isWaitingForUser && email && (
                    <div className="rounded-lg border p-3 text-sm bg-muted/50">
                        Sent to <span className="font-medium text-foreground">{email}</span>
                    </div>
                )}

                {isSuccess && (
                    <Button asChild className="w-full">
                        <Link href="/login">Sign in</Link>
                    </Button>
                )}

                {(isError || isWaitingForUser) && (
                    <Button asChild variant="secondary" className="w-full">
                        <Link href={`/resend-verify${email ? `?email=${encodeURIComponent(email)}` : ""}`}>
                            Resend verification email
                        </Link>
                    </Button>
                )}

                <div className="text-center pt-2">
                    <Link className="text-sm underline underline-offset-4 text-muted-foreground hover:text-primary" href="/login">
                        Back to sign in
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}