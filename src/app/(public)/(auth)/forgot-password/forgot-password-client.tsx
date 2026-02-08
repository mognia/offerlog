"use client";

import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiFetch } from "@/lib/api-fetch";
import { useApiAction } from "@/hooks/use-api-action";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Target, KeyRound, MailCheck, ArrowLeft } from "lucide-react";

const schema = z.object({
    email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;
type ForgotResponse = { ok: true };

export default function ForgotPasswordClient() {
    const { run, loading } = useApiAction<ForgotResponse>();
    const [sentTo, setSentTo] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: "" },
    });

    const { register, handleSubmit, formState: { errors }, getValues } = form;

    async function onSubmit(values: FormValues) {
        await run(
            () =>
                apiFetch<ForgotResponse>("/api/auth/forgot-password", {
                    method: "POST",
                    body: JSON.stringify({ email: values.email }),
                }),
            {
                onSuccess: () => setSentTo(getValues("email")),
            },
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            {/* Minimal Brand Logo */}
            <div className="mb-8 flex flex-col items-center gap-2 opacity-80">
                <Target className="h-8 w-8 text-primary" />
                <h1 className="text-lg font-bold tracking-tighter">OfferLog</h1>
            </div>

            <Card className="w-full max-w-md border-2 shadow-none rounded-2xl overflow-hidden">
                {sentTo ? (
                    /* SUCCESS STATE */
                    <>
                        <div className="flex justify-center py-10 bg-primary/5 border-b-2 border-dashed">
                            <div className="relative">
                                <MailCheck className="h-16 w-16 text-primary" />
                                <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full animate-ping" />
                            </div>
                        </div>
                        <CardHeader className="space-y-2 pb-6 text-center">
                            <CardTitle className="text-2xl font-black tracking-tight">Check your email</CardTitle>
                            <CardDescription className="text-sm font-medium">
                                If an account exists for that address, a secure recovery link is on its way.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pb-10">
                            <div className="rounded-xl border-2 border-dashed p-4 text-center bg-muted/30">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Recovery Target</p>
                                <span className="font-mono text-sm font-medium">{sentTo}</span>
                            </div>
                            <Button asChild className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/10">
                                <Link href="/login">Return to Sign In</Link>
                            </Button>
                        </CardContent>
                    </>
                ) : (
                    /* INITIAL STATE */
                    <>
                        <CardHeader className="space-y-1 pb-6 text-center border-b bg-muted/30">
                            <div className="flex justify-center mb-2">
                                <KeyRound className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight">Recovery</CardTitle>
                            <CardDescription className="text-xs font-medium uppercase tracking-widest">
                                Reset your access credentials
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-8 space-y-6">
                            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">Registered Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your account email"
                                        className="h-11 rounded-lg border-2 focus-visible:ring-primary"
                                        {...register("email")}
                                    />
                                    {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
                                </div>

                                <Button className="w-full h-12 rounded-xl text-sm font-bold shadow-md shadow-primary/10 transition-all active:scale-[0.98]" type="submit" disabled={loading}>
                                    {loading ? "Processing..." : "Issue Reset Link"}
                                </Button>
                            </form>

                            <div className="text-center pt-2">
                                <Link
                                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                                    href="/login"
                                >
                                    <ArrowLeft className="h-3 w-3" />
                                    Back to sign in
                                </Link>
                            </div>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
}