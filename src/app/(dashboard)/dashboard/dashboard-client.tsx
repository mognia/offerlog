"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api-fetch";
import { useApiQuery } from "@/hooks/use-api-query";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/empty-state";

// --- Modular Component Imports ---
import { DashboardHeader } from "@/app/(dashboard)/dashboard/components/dashboard-header";
import { DashboardFilters } from "@/app/(dashboard)/dashboard/components/dashboard-filters";
import { KpiGrid } from "@/app/(dashboard)/dashboard/components/kpi-grid";
import { ActionLists } from "@/app/(dashboard)/dashboard/components/action-lists";
import { ChartsSection } from "@/app/(dashboard)/dashboard/components/charts-section";
import { RoiSection } from "@/app/(dashboard)/dashboard/components/roi-section";
import {ApplicationStatus, EventOutcome, InterviewChannel, StageType} from "@/lib/prisma-client-types";

type SourceBucket =
    | "LINKEDIN"
    | "REFERRAL"
    | "RECRUITER"
    | "COMPANY_SITE"
    | "JOB_BOARD"
    | "OTHER";

/** ---------- Response Types ---------- */

type ActionCenterResponse = {
    ok: true;
    kpis: {
        countsByStatus: Record<ApplicationStatus, number>;
        overdueFollowupsCount: number;
        dueTodayFollowupsCount: number;
        staleOpenCount7: number;
        staleOpenCount14: number;
        staleOpenCount21: number;
        noResponseRiskCount: number;
        noActivityRiskCount: number;
    };
    lists: {
        overdueFollowups: Array<{
            appId: string;
            companyName: string;
            roleTitle: string;
            stage: string;
            followUpAt: string; // ISO
            daysOverdue: number;
        }>;
        dueTodayFollowups: Array<{
            appId: string;
            companyName: string;
            roleTitle: string;
            stage: string;
            followUpAt: string; // ISO
            daysOverdue: 0;
        }>;
        staleOpenApps: Array<{
            appId: string;
            companyName: string;
            roleTitle: string;
            daysSinceLastActivity: number;
        }>;
        noResponseRiskApps: Array<{
            appId: string;
            companyName: string;
            roleTitle: string;
            daysSinceApplied: number;
        }>;
        noActivityRiskApps: Array<{
            appId: string;
            companyName: string;
            roleTitle: string;
            daysSinceApplied: number;
        }>;
    };
    charts: {
        upcomingFollowupsByDay: Array<{ date: string; count: number }>; // YYYY-MM-DD (client local)
    };
};

type SpeedResponse = {
    ok: true;
    firstResponse: { medianHours: number | null; p75Hours: number | null };
    weeklyTrend: Array<{ weekStart: string; medianHours: number | null }>; // weekStart = YYYY-MM-DD
    timeToCloseByStatus: {
        HIRED: number | null;
        REJECTED: number | null;
        GHOSTED: number | null;
    };
};

type FunnelResponse = {
    ok: true;
    reachedCounts: Record<StageType, number>;
    conversions: Array<{
        from: StageType;
        to: StageType;
        fromCount: number;
        toCount: number;
        rate: number | null;
    }>;
    offerToHire: { offers: number; hires: number; rate: number | null };
};

type OutcomesResponse = {
    ok: true;
    byStageType: Record<StageType, Record<EventOutcome, number>>;
    byChannel: Record<InterviewChannel, Record<EventOutcome, number>>;
    topDropoffStages: Array<{ stageType: StageType; failCount: number; failRate: number | null }>;
};


type HygieneResponse = {
    ok: true;
    rates: {
        followUpSetRate: number | null;
        onTimeFollowUpCompletionRate: number | null;
        avgLateHours: number | null;
        feedbackCoverageRate: number | null;
        nextTalkingPointsCoverageRate: number | null;
    };
    counts: {
        pendingEvents: number;
        pendingWithFollowUp: number;
        followUpsDone: number;
        followUpsOnTime: number;
        lateCount: number;
        withFeedback: number;
        withNextTalkingPoints: number;
        totalEvents: number;
    };
};

type RoiResponse = {
    ok: true;
    byWorkMode: Array<{ key: string; count: number; hireRate: number | null; ghostRate: number | null; medianFirstResponseHours: number | null }>;
    bySourceBucket: Array<{ key: string; count: number; hireRate: number | null; ghostRate: number | null; medianFirstResponseHours: number | null }>;
    topRawSourcesByBucket: Record<SourceBucket, Array<{ source: string; count: number }>>;
};

type RoleRoiResponse = {
    ok: true;
    roles: Array<{
        roleTitle: string;
        key: string;
        count: number;
        hireRate: number | null;
        ghostRate: number | null;
        medianFirstResponseHours: number | null;
        medianEventsPerApplication: number | null;
        highEffortLowReturn: boolean;
    }>;
};

// --- UTILS ---
function pad2(n: number) { return String(n).padStart(2, "0"); }
function toLocalDateString(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function parseLocalDate(yyyyMmDd: string) {
    const [y, m, d] = yyyyMmDd.split("-").map((x) => Number(x));
    return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}
function buildCohortRangeIso(fromLocal: string, toLocal: string) {
    const from = parseLocalDate(fromLocal);
    const to = parseLocalDate(toLocal);
    const toEnd = new Date(to);
    toEnd.setHours(23, 59, 59, 999);
    return { fromIso: from.toISOString(), toIso: toEnd.toISOString() };
}
function buildQuery(filters: any) {
    const sp = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") sp.set(k, String(v));
    });
    return sp.toString();
}

export default function DashboardClient() {
    const tzOffsetMinutes = React.useMemo(() => new Date().getTimezoneOffset(), []);

    // Filter States
    const [fromLocal, setFromLocal] = React.useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return toLocalDateString(d);
    });
    const [toLocal, setToLocal] = React.useState(() => toLocalDateString(new Date()));
    const [status, setStatus] = React.useState("OPEN");
    const [workMode, setWorkMode] = React.useState("");
    const [sourceBucket, setSourceBucket] = React.useState("");
    const [sourceDraft, setSourceDraft] = React.useState("");
    const [source, setSource] = React.useState("");
    const [refreshKey, setRefreshKey] = React.useState(0);

    React.useEffect(() => {
        const t = setTimeout(() => setSource(sourceDraft.trim()), 250);
        return () => clearTimeout(t);
    }, [sourceDraft]);

    const { fromIso, toIso } = React.useMemo(() => buildCohortRangeIso(fromLocal, toLocal), [fromLocal, toLocal]);

    const filters = React.useMemo(() => ({
        from: fromIso,
        to: toIso,
        tzOffsetMinutes,
        status: status || undefined,
        workMode: workMode || undefined,
        source: source || undefined,
        sourceBucket: sourceBucket || undefined,
    }), [fromIso, toIso, tzOffsetMinutes, status, workMode, source, sourceBucket]);

    const qs = React.useMemo(() => buildQuery(filters), [filters]);

    // Data Fetching (Fully Typed)
    const actionCenterQ = useApiQuery<ActionCenterResponse>(() => apiFetch(`/api/dashboard/action-center?${qs}`), [qs, refreshKey]);
    const speedQ = useApiQuery<SpeedResponse>(() => apiFetch(`/api/dashboard/speed?${qs}`), [qs, refreshKey]);
    const funnelQ = useApiQuery<FunnelResponse>(() => apiFetch(`/api/dashboard/funnel?${qs}`), [qs, refreshKey]);
    const outcomesQ = useApiQuery<OutcomesResponse>(() => apiFetch(`/api/dashboard/outcomes?${qs}`), [qs, refreshKey]);
    const hygieneQ = useApiQuery<HygieneResponse>(() => apiFetch(`/api/dashboard/hygiene?${qs}`), [qs, refreshKey]);
    const roiQ = useApiQuery<RoiResponse>(() => apiFetch(`/api/dashboard/roi?${qs}`), [qs, refreshKey]);
    const roleRoiQ = useApiQuery<RoleRoiResponse>(() => apiFetch(`/api/dashboard/role-roi?${qs}`), [qs, refreshKey]);

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-24 animate-in fade-in duration-500">
            <DashboardHeader />

            <DashboardFilters
                fromLocal={fromLocal} setFromLocal={setFromLocal}
                toLocal={toLocal} setToLocal={setToLocal}
                status={status} setStatus={setStatus}
                workMode={workMode} setWorkMode={setWorkMode}
                sourceBucket={sourceBucket} setSourceBucket={setSourceBucket}
                sourceDraft={sourceDraft} setSourceDraft={setSourceDraft}
                onRefresh={() => setRefreshKey(k => k + 1)}
            />

            {/* KPIs */}
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold tracking-tight">Snapshot</h2>
                    <Separator className="flex-1" />
                </div>
                <KpiGrid loading={actionCenterQ.loading} data={actionCenterQ.data} />
            </section>

            {/* Focus & Action */}
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold tracking-tight">Action Center</h2>
                    <Separator className="flex-1" />
                </div>
                {actionCenterQ.data?.charts?.upcomingFollowupsByDay && (
                    <UpcomingActivityChart data={actionCenterQ.data.charts.upcomingFollowupsByDay} />
                )}
                <ActionLists loading={actionCenterQ.loading} data={actionCenterQ.data} />
            </section>

            {/* Analytics */}
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold tracking-tight">Performance Analytics</h2>
                    <Separator className="flex-1" />
                </div>
                <ChartsSection
                    speedLoading={speedQ.loading} speedData={speedQ.data}
                    funnelLoading={funnelQ.loading} funnelData={funnelQ.data}
                    outcomesLoading={outcomesQ.loading} outcomesData={outcomesQ.data}
                />
            </section>

            {/* ROI */}
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold tracking-tight">Efficiency & ROI</h2>
                    <Separator className="flex-1" />
                </div>
                <RoiSection
                    hygieneLoading={hygieneQ.loading} hygieneData={hygieneQ.data}
                    roiLoading={roiQ.loading} roiData={roiQ.data}
                    roleRoiLoading={roleRoiQ.loading} roleRoiData={roleRoiQ.data}
                />
            </section>
        </div>
    );
}

function UpcomingActivityChart({ data }: { data: Array<{ date: string; count: number }> }) {
    const total = data.reduce((acc, curr) => acc + curr.count, 0);
    if (total === 0) return null;
    const max = Math.max(1, ...data.map((d) => d.count));

    return (
        <Card className="rounded-2xl border bg-card shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Upcoming (Next 7 Days)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2 items-end h-24 pt-2">
                    {data.map((d) => (
                        <div key={d.date} className="flex flex-col items-center gap-1 group">
                            <div className="w-full relative h-full flex items-end">
                                <div className="w-full bg-primary/20 rounded-t-sm group-hover:bg-primary/40 transition-all" style={{ height: `${(d.count/max)*100}%` }} />
                            </div>
                            <div className="text-[9px] text-muted-foreground">{d.date.slice(5)}</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}