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

const schema = z.object({
    email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;
type ResendResponse = { ok: true };

export default function ResendVerifyClient({ initialEmail }: { initialEmail?: string }) {
    const { run, loading } = useApiAction<ResendResponse>();
    const [sentTo, setSentTo] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: initialEmail || "" },
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues,
    } = form;

    async function onSubmit(values: FormValues) {
        await run(
            () =>
                apiFetch<ResendResponse>("/api/auth/resend-verification", {
                    method: "POST",
                    body: JSON.stringify({ email: values.email }),
                }),
            {
                onSuccess: () => setSentTo(getValues("email")),
            },
        );
    }

    if (sentTo) {
        return (
            <Card className="w-full max-w-md shadow-sm">
                <CardHeader className="space-y-2">
                    <CardTitle className="text-2xl">Verification email sent</CardTitle>
                    <CardDescription>Check your inbox and open the link.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border p-3 text-sm">
                        Sent to <span className="font-medium">{sentTo}</span>
                    </div>

                    <Button asChild className="w-full">
                        <Link href="/login">Back to sign in</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md shadow-sm">
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">Resend verification</CardTitle>
                <CardDescription>We’ll send a new verification link if the account exists.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" autoComplete="email" {...register("email")} />
                        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
                    </div>

                    <Button className="w-full" type="submit" disabled={loading}>
                        {loading ? "Sending..." : "Send verification email"}
                    </Button>

                    <div className="text-sm text-muted-foreground">
                        <Link className="underline underline-offset-4" href="/login">
                            Back to sign in
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}