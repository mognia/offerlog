"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Building2,
    Briefcase,
    Link as LinkIcon,
    AlignLeft,
    ChevronLeft,
    Loader2,
    Plus,
    MapPin,
    Compass,
    Activity
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- SCHEMA (Synced with Backend) ---
const schema = z.object({
    companyName: z.string().min(1, "Required").max(120),
    role: z.string().min(1, "Required").max(120),
    jobUrl: z.url().optional().or(z.literal("")),
    location: z.string().max(120).optional().or(z.literal("")),
    source: z.string().max(120).optional().or(z.literal("")),
    notes: z.string().max(400, "Max 400 characters").optional().or(z.literal("")),
    status: z.enum(["OPEN", "HIRED", "REJECTED", "GHOSTED"]).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewApplicationClient() {
    const router = useRouter();
    const [err, setErr] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            companyName: "",
            role: "",
            jobUrl: "",
            location: "",
            source: "",
            notes: "",
            status: "OPEN"
        }
    });

    const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
    const currentStatus = watch("status");

    async function onSubmit(values: FormValues) {
        setErr(null);
        setIsPending(true);
        try {
            const res = await fetch("/api/applications", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values)
            });
            const json = await res.json();
            if (!json.ok) {
                setErr(json.error || "Failed to create application");
                return;
            }
            const bp = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
            router.push(`${bp}/applications/${json.application.id}`);
        } catch (e) {
            setErr("A network error occurred.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="group text-muted-foreground hover:text-foreground -ml-2"
            >
                <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to list
            </Button>

            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:border">
                <CardHeader className="space-y-1 pb-8 border-b mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Plus className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold tracking-tight">New Application</CardTitle>
                            <CardDescription>Track a new opportunity in your pipeline.</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Section 1: Core Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    Company Name *
                                </Label>
                                <Input
                                    {...register("companyName")}
                                    placeholder="e.g. Google"
                                    className={cn("rounded-xl", errors.companyName && "border-destructive")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                    Role / Position *
                                </Label>
                                <Input
                                    {...register("role")}
                                    placeholder="e.g. Product Designer"
                                    className={cn("rounded-xl", errors.role && "border-destructive")}
                                />
                            </div>
                        </div>

                        {/* Section 2: Context */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    Location
                                </Label>
                                <Input
                                    {...register("location")}
                                    placeholder="e.g. Remote / New York"
                                    className="rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <Compass className="h-4 w-4 text-muted-foreground" />
                                    Source
                                </Label>
                                <Input
                                    {...register("source")}
                                    placeholder="e.g. LinkedIn, Referral"
                                    className="rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Section 3: Links & Status */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                    Job URL
                                </Label>
                                <Input
                                    {...register("jobUrl")}
                                    placeholder="https://..."
                                    className={cn("rounded-xl", errors.jobUrl && "border-destructive")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                    Initial Status
                                </Label>
                                <Select
                                    value={currentStatus}
                                    onValueChange={(v) => setValue("status", v as any)}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OPEN">Open</SelectItem>
                                        <SelectItem value="HIRED">Hired</SelectItem>
                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                        <SelectItem value="GHOSTED">Ghosted</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Section 4: Notes */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <AlignLeft className="h-4 w-4 text-muted-foreground" />
                                Notes
                            </Label>
                            <Textarea
                                {...register("notes")}
                                placeholder="Quick thoughts or reminders..."
                                rows={4}
                                className={cn("rounded-xl resize-none", errors.notes && "border-destructive")}
                            />
                            <div className="flex justify-end">
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest",
                                    errors.notes ? "text-destructive" : "text-muted-foreground"
                                )}>
                                    {watch("notes")?.length || 0} / 400 Characters
                                </span>
                            </div>
                        </div>

                        {err && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in shake-1">
                                {err}
                            </div>
                        )}

                        <div className="pt-4 flex items-center gap-3">
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="flex-1 rounded-xl h-12 font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Application"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="rounded-xl h-12 px-8"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}