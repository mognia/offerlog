"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { apiFetch } from "@/lib/api-fetch";
import { useApiAction } from "@/hooks/use-api-action";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


const schema = z.
    object({
    email: z.email('Enter a valid email address'),
    password: z.string().min(8,'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1,'Confirm your password'),
})  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
});

type FormValues = z.infer<typeof schema>;

type RegisterResponse = { ok: true };

export default function RegisterForm() {
    const router = useRouter();
    const {run, loading} = useApiAction<RegisterResponse>();

    const form = useForm <FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {email:"",password:"",confirmPassword:""}
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
                apiFetch<RegisterResponse>("/api/auth/register", {
                    method: "POST",
                    body: JSON.stringify({ email: values.email, password: values.password }),
                }),
            {
                onSuccess: () => {
                    const email = getValues("email");
                    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
                },
            },
        );
    }
    return (
        <Card className="w-full max-w-md shadow-sm">
            <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">Create account</CardTitle>
                <CardDescription>Start tracking your pipeline and follow-ups.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" autoComplete="email" {...register("email")} />
                        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
                        {errors.password ? (
                            <p className="text-sm text-destructive">{errors.password.message}</p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            {...register("confirmPassword")}
                        />
                        {errors.confirmPassword ? (
                            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                        ) : null}
                    </div>

                    <Button className="w-full" type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create account"}
                    </Button>

                    <div className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link className="underline underline-offset-4" href="/login">
                            Sign in
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}