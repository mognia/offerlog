"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiFetch, ApiError } from "@/lib/api-fetch";
import { useApiAction } from "@/hooks/use-api-action";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Target, AlertCircle } from "lucide-react";

const schema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;
type LoginResponse = { ok: true; user?: { id: string; email: string } };

export default function LoginForm() {
    const router = useRouter();
    const { run, loading } = useApiAction<LoginResponse>();
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: "", password: "" },
        mode: "onSubmit",
    });

    async function onSubmit(values: FormValues) {
        setUnverifiedEmail(null);
        await run(
            async () => {
                try {
                    return await apiFetch<LoginResponse>("/api/auth/login", {
                        method: "POST",
                        body: JSON.stringify(values),
                    });
                } catch (e) {
                    if (e instanceof ApiError) {
                        const msg = (e.message || "").toLowerCase();
                        if (e.status === 403 || msg.includes("not verified") || msg.includes("unverified")) {
                            setUnverifiedEmail(values.email);
                        }
                    }
                    throw e;
                }
            },
            { onSuccess: () => {
                    router.push(`/applications`);
                } }
        );
    }

    const { register, handleSubmit, formState: { errors } } = form;

    return (
        <div className="flex flex-col items-center justify-center  px-4 ">
            <div className="mb-8 flex flex-col items-center gap-2">
                <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Target className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold tracking-tighter">OfferLog</h1>
            </div>

            <Card className="w-full max-w-md border-2 shadow-none rounded-2xl overflow-hidden">
                <CardHeader className="space-y-1 pb-6 text-center border-b bg-muted/30">
                    <CardTitle className="text-2xl font-black tracking-tight">Sign in</CardTitle>
                    <CardDescription className="text-xs font-medium uppercase tracking-widest">
                        Resume your pipeline tracking
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-8 space-y-6">
                    {unverifiedEmail && (
                        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p>
                                Account not verified.{" "}
                                <Link className="font-bold underline underline-offset-4" href={`/resend-verify?email=${encodeURIComponent(unverifiedEmail)}`}>
                                    Resend email
                                </Link>
                            </p>
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">Email Address</Label>
                            <Input id="email" type="email" placeholder="name@company.com" className="h-11 rounded-lg border-2 focus-visible:ring-primary" {...register("email")} />
                            {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password" className="text-xs font-bold uppercase text-muted-foreground">Password</Label>
                                <Link className="text-[10px] font-bold uppercase text-primary hover:underline" href="/forgot-password">Forgot?</Link>
                            </div>
                            <Input id="password" type="password" className="h-11 rounded-lg border-2" {...register("password")} />
                            {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
                        </div>

                        <Button className="w-full h-12 rounded-xl text-sm font-bold shadow-md shadow-primary/10 transition-all active:scale-[0.98]" type="submit" disabled={loading}>
                            {loading ? "Authenticating..." : "Sign in to Dashboard"}
                        </Button>
                    </form>

                    <div className="text-center pt-2">
                        <p className="text-sm text-muted-foreground">
                            New here?{" "}
                            <Link className="font-bold text-foreground underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all" href="/register">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}