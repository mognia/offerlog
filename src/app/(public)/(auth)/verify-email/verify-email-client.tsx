"use client";

import Link from "next/link";
import { apiFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { useRef } from "react";
import { Mail, CheckCircle, XCircle, Loader2, Target } from "lucide-react";

type Props = { token?: string; email?: string };

export default function VerifyEmailClient({ token, email }: Props) {
    const hasCalled = useRef(false);

    const { data, loading } = useApiQuery(
        () => {
            if (!token || hasCalled.current) return Promise.resolve(null);
            hasCalled.current = true;
            return apiFetch<{ ok: true }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        },
        [token]
    );

    const isVerifying = !!token && loading;
    const isSuccess = !!data;
    const isError = !!token && !loading && !data;
    const isWaitingForUser = !token;

    const current = isVerifying
        ? { title: "Verifying...", desc: "Checking your unique token.", icon: <Loader2 className="h-12 w-12 text-primary animate-spin" />, color: "bg-primary/10" }
        : isSuccess
            ? { title: "Verified", desc: "Your identity is confirmed.", icon: <CheckCircle className="h-12 w-12 text-emerald-500" />, color: "bg-emerald-500/10" }
            : isError
                ? { title: "Invalid Link", desc: "This link has expired or is broken.", icon: <XCircle className="h-12 w-12 text-destructive" />, color: "bg-destructive/10" }
                : { title: "Check Inbox", desc: "We sent a link to activate your account.", icon: <Mail className="h-12 w-12 text-primary" />, color: "bg-primary/10" };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="mb-8 flex flex-col items-center gap-2 opacity-50">
                <Target className="h-8 w-8" />
                <h1 className="text-lg font-bold tracking-tighter">OfferLog</h1>
            </div>

            <Card className="w-full max-w-md border-2 shadow-none rounded-2xl overflow-hidden text-center">
                <div className={`flex justify-center py-10 ${current.color}`}>
                    {current.icon}
                </div>

                <CardHeader className="space-y-2 pb-8">
                    <CardTitle className="text-3xl font-black tracking-tight">{current.title}</CardTitle>
                    <CardDescription className="text-sm font-medium px-4">{current.desc}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pb-10">
                    {isWaitingForUser && email && (
                        <div className="mx-auto max-w-[280px] rounded-lg border-2 border-dashed p-3 text-xs font-mono bg-muted/30">
                            Sent to: {email}
                        </div>
                    )}

                    {isSuccess ? (
                        <Button asChild className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20 transition-transform active:scale-95">
                            <Link href="/login">Launch Dashboard</Link>
                        </Button>
                    ) : (
                        <Button asChild variant="secondary" className="w-full h-12 rounded-xl font-bold border-2">
                            <Link href={`/resend-verify${email ? `?email=${encodeURIComponent(email)}` : ""}`}>
                                {isError ? "Request New Link" : "Resend Verification Email"}
                            </Link>
                        </Button>
                    )}

                    <div className="pt-2">
                        <Link className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" href="/login">
                            ← Back to Sign In
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}