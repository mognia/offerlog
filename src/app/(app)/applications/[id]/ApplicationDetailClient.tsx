"use client";

import Link from "next/link";
import {
    ExternalLink,
    MapPin,
    Compass,
    FileText,
    Building2,
    ArrowLeft,
    Calendar,
    Globe
} from "lucide-react";

import { apiFetch } from "@/lib/api-fetch";
import { useApiQuery } from "@/hooks/use-api-query";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/empty-state";

import { StatusBadge } from "@/components/app/status-badge";
import { cn } from "@/lib/utils";
import PipelineTabClient from "@/app/(app)/applications/[id]/PipelineTabClient";

// --- TYPES ---
type Status = "OPEN" | "HIRED" | "REJECTED" | "GHOSTED";

type Application = {
    id: string;
    companyName: string;
    roleTitle: string; // Sticking to your prop name for logic safety
    status: Status;
    updatedAt: string;
    jobUrl?: string | null;
    location?: string | null;
    source?: string | null;
    notes?: string | null;
};

type GetAppResponse = { ok: true; application: Application };

// --- UTILS ---
function formatDate(s: string) {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
}

export default function ApplicationDetailClient({ applicationId }: { applicationId: string }) {
    const { data, loading } = useApiQuery<GetAppResponse>(
        () => apiFetch(`/api/applications/${applicationId}`),
        [applicationId],
    );

    const app = data?.ok ? data.application : null;

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-8 pt-4">
                <div className="flex justify-between items-end">
                    <div className="space-y-3 w-1/2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-24 rounded-full" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-2xl" />
            </div>
        );
    }

    if (!app) {
        return (
            <div className="pt-20">
                <EmptyState
                    title="Application not found"
                    description="We couldn't find the details for this role. It might have been deleted or the link is incorrect."
                    action={
                        <Button asChild variant="outline" className="rounded-xl">
                            <Link href="/applications" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Pipeline
                            </Link>
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* 1. Breadcrumb & Actions Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <Link
                        href="/applications"
                        className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Applications
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{app.roleTitle}</h1>
                        <StatusBadge className="rounded-full px-4 py-1 text-[10px] uppercase tracking-widest font-bold" status={app.status}/>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">{app.companyName}</span>
                        <span className="mx-1">•</span>
                        <Calendar className="h-4 w-4" />
                        <span>Updated {formatDate(app.updatedAt)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {app.jobUrl && (
                        <Button asChild variant="outline" size="sm" className="rounded-xl hidden sm:flex">
                            <a href={app.jobUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                View Job Post
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            {/* 2. Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <div className="border-b pb-1">
                    <TabsList variant={'line'} className="bg-transparent h-auto p-0 gap-6">
                        <TabsTrigger
                            value="overview"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="pipeline"
                        >
                            Interview Pipeline
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Details Sidebar/Column */}
                        <div className="space-y-6">
                            <Card className="rounded-2xl border-none bg-muted/30 shadow-none">
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Attributes</h3>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-background border">
                                                    <MapPin className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Location</p>
                                                    <p className="text-sm font-medium">{app.location || "Not specified"}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-background border">
                                                    <Compass className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Source</p>
                                                    <p className="text-sm font-medium">{app.source || "Direct"}</p>
                                                </div>
                                            </div>

                                            {app.jobUrl && (
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-background border">
                                                        <ExternalLink className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase text-muted-foreground font-bold">Original Post</p>
                                                        <a href={app.jobUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                                            View Link <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Notes Area */}
                        <div className="md:col-span-2">
                            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
                                <div className="bg-muted/30 px-6 py-4 border-b flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <h3 className="text-sm font-bold">Application Notes</h3>
                                </div>
                                <CardContent className="p-6">
                                    {app.notes?.trim() ? (
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                                            {app.notes}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl border-muted">
                                            <p className="text-sm text-muted-foreground">No notes added .</p>
                                            {/*TODO: add edit functionality for v2*/}
                                            {/*<Button variant="link" size="sm" asChild>*/}
                                            {/*    <Link href={`/applications/${app.id}/edit`}>Add context</Link>*/}
                                            {/*</Button>*/}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="pipeline" className="animate-in fade-in slide-in-from-right-2 duration-300">
                    <PipelineTabClient applicationId={app.id} appStatus={app.status} />
                </TabsContent>
            </Tabs>
        </div>
    );
}