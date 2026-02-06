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
import {useState} from "react";

const schema = z
    .object({
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((v) => v.password === v.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
    });

type FormValues = z.infer<typeof schema>;

type ResetResponse = { ok: true };

export default function ResetPasswordClient({ token }: { token?: string }) {
    const { run, loading } = useApiAction<ResetResponse>();
    const [done, setDone] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = form;

    async function onSubmit(values: FormValues) {
        if (!token) return;

        await run(
            () =>
                apiFetch<ResetResponse>("/api/auth/reset-password", {
                    method: "POST",
                    body: JSON.stringify({ token, password: values.password }),
                }),
            {
                onSuccess: () => setDone(true),
            },
        );
    }

    if (!token) {
        return (
            <Card className="w-full max-w-md shadow-sm">
                <CardHeader className="space-y-2">
                    <CardTitle className="text-2xl">Invalid reset link</CardTitle>
                    <CardDescription>This link is missing a token or is malformed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button asChild className="w-full">
                        <Link href="/forgot-password">Request a new link</Link>
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        <Link className="underline underline-offset-4" href="/login">
                            Back to sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (done) {
        return (
            <Card className="w-full max-w-md shadow-sm">
                <CardHeader className="space-y-2">
                    <CardTitle className="text-2xl">Password updated</CardTitle>
                    <CardDescription>You can sign in with your new password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button asChild className="w-full">
                        <Link href="/login">Sign in</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md shadow-sm">
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">Set a new password</CardTitle>
                <CardDescription>Choose a strong password you won’t immediately forget.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-2">
                        <Label htmlFor="password">New password</Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            disabled={loading} // Add this
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-sm font-medium text-destructive">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            disabled={loading} // Add this
                            {...register("confirmPassword")}
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm font-medium text-destructive">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <Button className="w-full" type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Update password"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
