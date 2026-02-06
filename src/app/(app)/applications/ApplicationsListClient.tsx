"use client";

import Link from "next/link";

import { apiFetch } from "@/lib/api-fetch";
import { toastApiError } from "@/lib/toast-error";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiAction } from "@/hooks/use-api-action";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import {useEffect, useState} from "react";
import {cn} from "@/lib/utils";
import {StatusBadge} from "@/components/app/status-badge";

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
    return d.toLocaleString();
}

export default function ApplicationsListClient() {
    const [status, setStatus] = useState<"" | Status>("");
    const [items, setItems] = useState<AppRow[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasNext, setHasNext] = useState<boolean>(true);

    // Load first page whenever status changes (declarative)
    const { data, loading } = useApiQuery<ApplicationsResponse>(
        () => apiFetch(buildUrl(status)),
        [status],
    );

    // Apply query result into local pagination state
    useEffect(() => {
        if (!data?.ok) return;
        setItems(data.applications ?? []);
        setCursor(data.page?.nextCursor ?? null);
        setHasNext(Boolean(data.page?.hasNextPage));
    }, [data]);

    // Load more (imperative by nature)
    const { run: runLoadMore, loading: loadingMore } = useApiAction<ApplicationsResponse>();

    async function loadMore() {
        if (!hasNext || !cursor) return;

        const res = await runLoadMore(() => apiFetch(buildUrl(status, cursor)));
        if (!res?.ok) return;

        setItems((prev) => [...prev, ...(res.applications ?? [])]);
        setCursor(res.page?.nextCursor ?? null);
        setHasNext(Boolean(res.page?.hasNextPage));
    }

    const toggleStatus = (newStatus: "" | Status) => {
        // 1. Reset everything to 'fresh' state
        setItems([]);
        setCursor(null);
        setHasNext(true);

        // 2. Trigger the new fetch via useApiQuery
        setStatus(newStatus);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Applications"
                subtitle="Track pipeline, follow-ups, and outcomes."
                right={
                    <Button asChild>
                        <Link href="/applications/new">New application</Link>
                    </Button>
                }
            />

            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-2">
                {STATUSES.map((s) => {
                    const active = status === s.key;
                    return (
                        <Button
                            key={s.label}
                            variant={active ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleStatus(s.key)}
                        >
                            {s.label}
                        </Button>
                    );
                })}
            </div>

            {/* List body */}
            {loading ? (
                <div className="space-y-3">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                </div>
            ) : items.length === 0 ? (
                <EmptyState
                    title="No applications yet"
                    description="Add your first application, then track stages and follow-ups without losing your mind."
                    action={
                        <Button asChild>
                            <Link href="/applications/new">Create your first application</Link>
                        </Button>
                    }
                />
            ) : (
                <div className="grid gap-3">
                    {items.map((a) => (
                        <Link key={a.id} href={`/applications/${a.id}`} className="group">
                            <Card className="rounded-xl p-4 transition-shadow group-hover:shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 space-y-1">
                                        <div className="truncate text-base font-semibold">
                                            {a.roleTitle}
                                        </div>
                                        <div className="truncate text-sm text-muted-foreground">
                                            {a.companyName}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Last activity: {formatDate(a.lastActivityAt ?? a.updatedAt)}
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        <StatusBadge status={a.status} />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* Load more */}
            {items.length > 0 ? (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="secondary"
                        disabled={!hasNext || loadingMore}
                        onClick={() => loadMore().catch((e) => toastApiError(e, "Failed to load more"))}
                    >
                        {loadingMore ? "Loading..." : hasNext ? "Load more" : "No more"}
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
