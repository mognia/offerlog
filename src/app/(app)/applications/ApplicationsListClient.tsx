"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    Building2,
    Clock,
    Plus,
    Search,
    ChevronRight,
    LayoutGrid
} from "lucide-react";

import { apiFetch } from "@/lib/api-fetch";
import { toastApiError } from "@/lib/toast-error";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiAction } from "@/hooks/use-api-action";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/app/status-badge";

// --- TYPES (Unchanged) ---
type Status = "OPEN" | "HIRED" | "REJECTED" | "GHOSTED";
type AppRow = {
    id: string;
    companyName: string;
    roleTitle: string;
    status: Status;
    updatedAt: string;
    lastActivityAt?: string;
};

type ApplicationsResponse = {
    ok: true;
    applications: AppRow[];
    page?: {
        nextCursor?: string | null;
        hasNextPage?: boolean;
    };
};

const STATUSES: Array<{ key: "" | Status; label: string }> = [
    { key: "", label: "All" },
    { key: "OPEN", label: "Open" },
    { key: "HIRED", label: "Hired" },
    { key: "REJECTED", label: "Rejected" },
    { key: "GHOSTED", label: "Ghosted" },
];

// --- UTILS ---
function buildUrl(status: "" | Status, cursor?: string | null) {
    const qs = new URLSearchParams();
    qs.set("limit", "20");
    if (status) qs.set("status", status);
    if (cursor) qs.set("cursor", cursor);
    return `/api/applications?${qs.toString()}`;
}

function formatDate(s?: string) {
    if (!s) return "";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    // Cleaner date format
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
}

// Get first letter for avatar
function getInitials(name: string) {
    return name.charAt(0).toUpperCase();
}

export default function ApplicationsListClient() {
    const [status, setStatus] = useState<"" | Status>("");
    const [items, setItems] = useState<AppRow[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasNext, setHasNext] = useState<boolean>(true);

    const { data, loading } = useApiQuery<ApplicationsResponse>(
        () => apiFetch(buildUrl(status)),
        [status]
    );

    useEffect(() => {
        if (!data?.ok) return;
        setItems(data.applications ?? []);
        setCursor(data.page?.nextCursor ?? null);
        setHasNext(Boolean(data.page?.hasNextPage));
    }, [data]);

    const { run: runLoadMore, loading: loadingMore } =
        useApiAction<ApplicationsResponse>();

    async function loadMore() {
        if (!hasNext || !cursor) return;
        const res = await runLoadMore(() => apiFetch(buildUrl(status, cursor)));
        if (!res?.ok) return;
        setItems((prev) => [...prev, ...(res.applications ?? [])]);
        setCursor(res.page?.nextCursor ?? null);
        setHasNext(Boolean(res.page?.hasNextPage));
    }

    const toggleStatus = (newStatus: "" | Status) => {
        setItems([]);
        setCursor(null);
        setHasNext(true);
        setStatus(newStatus);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* 1. Enhanced Page Header */}
            <PageHeader
                title="Applications"
                subtitle="Manage your career progression and pipeline."
                right={
                    <Button asChild className="rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95">
                        <Link href="/applications/new" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            <span>New Application</span>
                        </Link>
                    </Button>
                }
            />

            {/* 2. Modern Filter Bar (Glassmorphic Pills) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                <div className="flex flex-wrap gap-1">
                    {STATUSES.map((s) => {
                        const active = status === s.key;
                        return (
                            <button
                                key={s.label}
                                onClick={() => toggleStatus(s.key)}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200",
                                    active
                                        ? "bg-background text-foreground shadow-sm border border-border"
                                        : "text-muted-foreground hover:bg-background/50"
                                )}
                            >
                                {s.label}
                            </button>
                        );
                    })}
                </div>

                <div className="px-3 text-xs text-muted-foreground flex items-center gap-2">
                    <LayoutGrid className="h-3 w-3" />
                    {items.length} {items.length === 1 ? 'Application' : 'Applications'}
                </div>
            </div>

            {/* 3. The List Body */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <EmptyState
                    title="No applications found"
                    description="Ready to start your next chapter? Add your first job application to begin tracking."
                    action={
                        <Button asChild variant="outline" className="rounded-xl">
                            <Link href="/applications/new">Create First Application</Link>
                        </Button>
                    }
                />
            ) : (
                <div className="grid gap-4">
                    {items.map((a) => (
                        <Link key={a.id} href={`/applications/${a.id}`} className="group block">
                            <Card className="relative overflow-hidden rounded-2xl border-border/50 bg-card p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-primary/20 group-hover:bg-accent/5">
                                <div className="flex items-center gap-5">

                                    {/* Company Avatar */}
                                    <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-bold text-lg border border-primary/10">
                                        {getInitials(a.companyName)}
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <h3 className="truncate text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
                                                {a.roleTitle}
                                            </h3>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                                                <Building2 className="h-3.5 w-3.5" />
                                                {a.companyName}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                Updated {formatDate(a.lastActivityAt ?? a.updatedAt)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Side */}
                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                        <StatusBadge status={a.status} className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider" />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* 4. Enhanced Pagination */}
            {items.length > 0 && (
                <div className="flex flex-col items-center gap-4 pt-6">
                    {hasNext && (
                        <Button
                            variant="outline"
                            disabled={loadingMore}
                            className="rounded-xl px-10 h-11 font-medium bg-background shadow-sm hover:bg-muted transition-all"
                            onClick={() => loadMore().catch((e) => toastApiError(e, "Failed to load more"))}
                        >
                            {loadingMore ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    <span>Loading...</span>
                                </div>
                            ) : (
                                "Show More Applications"
                            )}
                        </Button>
                    )}
                    {!hasNext && items.length > 5 && (
                        <p className="text-xs text-muted-foreground italic">You've reached the end of the pipeline.</p>
                    )}
                </div>
            )}
        </div>
    );
}