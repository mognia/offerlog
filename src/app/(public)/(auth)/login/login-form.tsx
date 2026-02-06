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
import {useState} from "react";

const schema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

type LoginResponse = {
    ok: true;
    // if your endpoint returns user, keep it, otherwise remove
    user?: { id: string; email: string };
};

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
                    // Special-case: unverified UX (show inline CTA instead of only toast)
                    if (e instanceof ApiError) {
                        const msg = (e.message || "").toLowerCase();
                        if (e.status === 403 || msg.includes("not verified") || msg.includes("unverified")) {
                            setUnverifiedEmail(values.email);
                        }
                    }
                    throw e; // still toast via useApiAction
                }
            },
            {
                onSuccess: () => router.push("/applications"),
            },
        );
    }

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = form;

    return (
        <Card className="w-full max-w-md shadow-sm">
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">Sign in</CardTitle>
                <CardDescription>
                    Track applications, follow-ups, and your funnel metrics.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
                {unverifiedEmail ? (
                    <div className="rounded-lg border p-3 text-sm">
                        Your account is not verified,{" "}
                        <Link
                            className="underline underline-offset-4"
                            href={`/resend-verify?email=${encodeURIComponent(unverifiedEmail)}`}
                        >
                            resend verification email
                        </Link>
                        .
                    </div>
                ) : null}

                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" autoComplete="email" {...register("email")} />
                        {errors.email ? (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            {...register("password")}
                        />
                        {errors.password ? (
                            <p className="text-sm text-destructive">{errors.password.message}</p>
                        ) : null}
                    </div>

                    <Button className="w-full" type="submit" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                    </Button>

                    <div className="flex items-center justify-between text-sm">
                        <Link className="underline underline-offset-4" href="/register">
                            Create account
                        </Link>
                        <Link className="underline underline-offset-4" href="/forgot-password">
                            Forgot password
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
