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
import { Target } from "lucide-react";

const schema = z.object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
});

type FormValues = z.infer<typeof schema>;
type RegisterResponse = { ok: true };

export default function RegisterForm() {
    const router = useRouter();
    const { run, loading } = useApiAction<RegisterResponse>();

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: "", password: "", confirmPassword: "" }
    });

    const { register, handleSubmit, formState: { errors }, getValues } = form;

    async function onSubmit(values: FormValues) {
        await run(
            () => apiFetch<RegisterResponse>("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ email: values.email, password: values.password }),
            }),
            {
                onSuccess: () => {
                    const bp = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
                    const email = getValues("email");
                    router.push(`${bp}/verify-email?email=${encodeURIComponent(email)}`);
                },
            }
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12">
            <div className="mb-8 flex flex-col items-center gap-2">
                <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Target className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold tracking-tighter text-foreground">OfferLog</h1>
            </div>

            <Card className="w-full max-w-md border-2 shadow-none rounded-2xl overflow-hidden">
                <CardHeader className="space-y-1 pb-6 text-center border-b bg-muted/30">
                    <CardTitle className="text-2xl font-black tracking-tight">Create Account</CardTitle>
                    <CardDescription className="text-xs font-medium uppercase tracking-widest">
                        Start your 100% honest job log
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-8 space-y-6">
                    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">Email</Label>
                            <Input id="email" type="email" placeholder="you@example.com" className="h-11 rounded-lg border-2" {...register("email")} />
                            {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs font-bold uppercase text-muted-foreground">Password</Label>
                            <Input id="password" type="password" className="h-11 rounded-lg border-2" {...register("password")} />
                            {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase text-muted-foreground">Confirm Password</Label>
                            <Input id="confirmPassword" type="password" className="h-11 rounded-lg border-2" {...register("confirmPassword")} />
                            {errors.confirmPassword && <p className="text-xs font-medium text-destructive">{errors.confirmPassword.message}</p>}
                        </div>

                        <Button className="w-full h-12 rounded-xl text-sm font-bold shadow-md shadow-primary/10 mt-2" type="submit" disabled={loading}>
                            {loading ? "Creating account..." : "Initialize Profile"}
                        </Button>
                    </form>

                    <div className="text-center pt-2 border-t border-dashed mt-6">
                        <p className="text-sm text-muted-foreground">
                            Already a user?{" "}
                            <Link className="font-bold text-foreground underline underline-offset-4 decoration-primary/30" href="/login">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}