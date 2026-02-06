"use client";

import Link from "next/link";

import { apiFetch } from "@/lib/api-fetch";
import { useApiQuery } from "@/hooks/use-api-query";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

import PipelineTabClient from "./PipelineTabClient";
import {StatusBadge} from "@/components/app/status-badge";

type Status = "OPEN" | "HIRED" | "REJECTED" | "GHOSTED";

type Application = {
    id: string;
    companyName: string;
    roleTitle: string;
    status: Status;
    updatedAt: string;
    jobUrl?: string | null;
    location?: string | null;
    source?: string | null;
    notes?: string | null;
};

type GetAppResponse = { ok: true; application: Application };

function formatDate(s: string) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

export default function ApplicationDetailClient({ applicationId }: { applicationId: string }) {
    const { data, loading } = useApiQuery<GetAppResponse>(
        () => apiFetch(`/api/applications/${applicationId}`),
        [applicationId],
    );

    const app = data?.ok ? data.application : null;

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (!app) {
        return (
            <EmptyState
                title="Application not found"
                description="Either it doesn’t exist, or it’s not yours. OfferLog is not a public museum."
                action={
                    <Button asChild variant="secondary">
                        <Link href="/applications">Back to applications</Link>
                    </Button>
                }
            />
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${app.roleTitle}`}
                subtitle={`${app.companyName} , updated ${formatDate(app.updatedAt)}`}
                right={
                    <StatusBadge className="rounded-full px-5 py-2 text-xs" status={app.status}/>
                }
            />

            <Tabs defaultValue="overview" className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                    </TabsList>

                    <Button asChild variant="secondary">
                        <Link href="/applications">Back</Link>
                    </Button>
                </div>

                <TabsContent value="overview">
                    <Card className="rounded-xl p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Job URL</div>
                                <div className="text-sm">
                                    {app.jobUrl ? (
                                        <a className="underline underline-offset-4" href={app.jobUrl} target="_blank" rel="noreferrer">
                                            Open posting
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Location</div>
                                <div className="text-sm">{app.location || <span className="text-muted-foreground">—</span>}</div>
                            </div>

                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Source</div>
                                <div className="text-sm">{app.source || <span className="text-muted-foreground">—</span>}</div>
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <div className="text-xs text-muted-foreground">Notes</div>
                                <div className="whitespace-pre-wrap text-sm">
                                    {app.notes?.trim() ? app.notes : <span className="text-muted-foreground">—</span>}
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="pipeline">
                    <PipelineTabClient applicationId={app.id} appStatus={app.status} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
