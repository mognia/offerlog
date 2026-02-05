"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {useEffect, useState} from "react";

type AppRow = {
    id: string;
    companyName: string;
    roleTitle: string;
    status: "OPEN" | "HIRED" | "REJECTED" | "GHOSTED";
    updatedAt: string;
    lastActivityAt?: string;
};

export default function ApplicationsListClient() {
    const [items, setItems] = useState<AppRow[]>([]);
    const [status, setStatus] = useState<string>("");
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasNext, setHasNext] = useState<boolean>(true);
    const [loading, setLoading] = useState(false);

    async function load(reset = false) {
        setLoading(true);
        const qs = new URLSearchParams();
        qs.set("limit", "20");
        if (!reset && cursor) qs.set("cursor", cursor);
        if (status) qs.set("status", status);

        const res = await fetch(`/api/applications?${qs.toString()}`, { credentials: "include" });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "Failed");

        const next = json.page?.nextCursor ?? null;
        const more = (json.applications ?? []) as AppRow[];

        setItems((prev) => (reset ? more : [...prev, ...more]));
        setCursor(next);
        setHasNext(Boolean(json.page?.hasNextPage));
        setLoading(false);
    }
    useEffect(() => {
        setCursor(null);
        setHasNext(true);
        load(true).catch(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-xl font-semibold">Applications</h1>
                <Button asChild><Link href="/applications/new">New</Link></Button>
            </div>

            <div className="flex items-center gap-2">
                <Button variant={status === "" ? "default" : "outline"} onClick={() => setStatus("")}>All</Button>
                {["OPEN", "HIRED", "REJECTED", "GHOSTED"].map((s) => (
                    <Button key={s} variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
                        {s}
                    </Button>
                ))}
            </div>

            <div className="divide-y rounded-md border">
                {items.map((a) => (
                    <Link key={a.id} href={`/applications/${a.id}`} className="block p-4 hover:bg-muted/50">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="font-medium">{a.companyName} , {a.roleTitle}</div>
                                <div className="text-sm text-muted-foreground">Updated: {new Date(a.updatedAt).toLocaleString()}</div>
                            </div>
                            <Badge>{a.status}</Badge>
                        </div>
                    </Link>
                ))}
                {items.length === 0 && <div className="p-6 text-sm text-muted-foreground">No applications yet.</div>}
            </div>

            <div className="flex justify-center">
                <Button disabled={!hasNext || loading} onClick={() => load(false)}>
                    {loading ? "Loading..." : hasNext ? "Load more" : "No more"}
                </Button>
            </div>
        </div>
    );
}