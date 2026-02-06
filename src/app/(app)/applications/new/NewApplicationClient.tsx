"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {useState} from "react";

const schema = z.object({
    companyName: z.string().min(1).max(120),
    roleTitle: z.string().min(1).max(120),
    jobUrl: z.url().optional().or(z.literal("")),
    notes: z.string().max(4000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function NewApplicationClient() {
    const router = useRouter();
    const [err, setErr] = useState<string| null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {companyName: "", roleTitle: "", jobUrl: "", notes: "" }
    });

    async function onSubmit(values: FormValues) {
        setErr(null);
        const res =  await fetch("/api/applications",{
            method: "POST",
            credentials: "include",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(values)
        });
        const json = await res.json();
        if (!json.ok) return setErr(json.error || "Failed to create");
        router.push(`/applications/${json.application.id}`);
    }

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold">New Application</h1>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="space-y-1">
                    <Label>Company</Label>
                    <Input {...form.register("companyName")} />
                </div>
                <div className="space-y-1">
                    <Label>Role</Label>
                    <Input {...form.register("roleTitle")} />
                </div>
                <div className="space-y-1">
                    <Label>Job URL</Label>
                    <Input {...form.register("jobUrl")} placeholder="https://..." />
                </div>
                <div className="space-y-1">
                    <Label>Notes</Label>
                    <Textarea {...form.register("notes")} rows={5} />
                </div>
                {err && <p className="text-sm text-red-600">{err}</p>}
                <Button className='cursor-pointer' type="submit">Create</Button>
            </form>
        </div>
    );
}