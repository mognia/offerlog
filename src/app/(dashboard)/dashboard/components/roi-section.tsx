import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, BarChart3, Briefcase } from "lucide-react";

interface RoiSectionProps {
    hygieneLoading: boolean;
    hygieneData: any;
    roiLoading: boolean;
    roiData: any;
    roleRoiLoading: boolean;
    roleRoiData: any;
}

export function RoiSection({
                               hygieneLoading,
                               hygieneData,
                               roiLoading,
                               roiData,
                               roleRoiLoading,
                               roleRoiData,
                           }: RoiSectionProps) {
    if (hygieneLoading || roiLoading || roleRoiLoading) {
        return <Skeleton className="h-64 w-full rounded-2xl" />;
    }

    return (
        <div className="space-y-8">

            {/* 1. HYGIENE ROW */}
            <section className="space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    <Activity className="h-4 w-4" /> Process Hygiene
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <HygieneCard
                        label="Follow-up Set Rate"
                        value={pct(hygieneData?.rates?.followUpSetRate)}
                        sub={`${hygieneData?.counts?.pendingWithFollowUp}/${hygieneData?.counts?.pendingEvents} pending`}
                    />
                    <HygieneCard
                        label="On-Time Completion"
                        value={pct(hygieneData?.rates?.onTimeFollowUpCompletionRate)}
                        sub={`${hygieneData?.counts?.followUpsOnTime} on time`}
                    />
                    <HygieneCard
                        label="Avg Lateness"
                        value={formatHours(hygieneData?.rates?.avgLateHours)}
                        sub={`${hygieneData?.counts?.lateCount} late`}
                        tone={hygieneData?.counts?.lateCount > 0 ? "danger" : "neutral"}
                    />
                    <HygieneCard
                        label="Feedback Coverage"
                        value={pct(hygieneData?.rates?.feedbackCoverageRate)}
                        sub="Events with notes"
                    />
                    <HygieneCard
                        label="Prep Coverage"
                        value={pct(hygieneData?.rates?.nextTalkingPointsCoverageRate)}
                        sub="Talking points set"
                    />
                </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* 2. ROI BY SOURCE/MODE */}
                <div className="xl:col-span-1 space-y-6">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        <BarChart3 className="h-4 w-4" /> ROI Breakdown
                    </h3>

                    <Card className="rounded-2xl border shadow-sm h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">By Work Mode</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {roiData?.byWorkMode?.map((r: any) => (
                                <RoiRow key={r.key} label={r.key} count={r.count} hireRate={r.hireRate} ghostRate={r.ghostRate} />
                            ))}

                            <div className="pt-4 mt-4 border-t">
                                <CardTitle className="text-sm font-medium mb-4">By Source Bucket</CardTitle>
                                {roiData?.bySourceBucket?.map((r: any) => (
                                    <RoiRow key={r.key} label={r.key} count={r.count} hireRate={r.hireRate} ghostRate={r.ghostRate} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. ROLE ROI TABLE */}
                <div className="xl:col-span-2 space-y-6">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        <Briefcase className="h-4 w-4" /> Role Performance
                    </h3>

                    <Card className="rounded-2xl border shadow-sm overflow-hidden">
                        <ScrollArea className="h-[400px]">
                            <div className="min-w-[600px]">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b text-xs font-bold text-muted-foreground uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                                    <div className="col-span-5">Role Title</div>
                                    <div className="col-span-2 text-right">Volume</div>
                                    <div className="col-span-2 text-right">Hire Rate</div>
                                    <div className="col-span-3 text-right">Effort / Return</div>
                                </div>

                                {/* Table Body */}
                                <div className="divide-y">
                                    {roleRoiData?.roles?.slice(0, 50).map((r: any) => (
                                        <div key={r.key} className="grid grid-cols-12 gap-4 px-6 py-4 items-center text-sm hover:bg-muted/20 transition-colors">
                                            <div className="col-span-5 min-w-0">
                                                <div className="font-semibold truncate text-foreground">{r.roleTitle}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    Avg response: {formatHours(r.medianFirstResponseHours)}
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-right font-medium">{r.count}</div>
                                            <div className="col-span-2 text-right">
                                        <span className={r.hireRate > 0 ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                                            {pct(r.hireRate)}
                                        </span>
                                            </div>
                                            <div className="col-span-3 text-right flex flex-col items-end gap-1">
                                                <div className="text-xs text-muted-foreground">{r.medianEventsPerApplication || 0} events/app</div>
                                                {r.highEffortLowReturn && (
                                                    <Badge variant="destructive" className="text-[10px] px-1.5 h-5">Low Return</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ScrollArea>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// --- Helpers ---

function HygieneCard({ label, value, sub, tone }: any) {
    return (
        <Card className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between ${tone === 'danger' ? 'bg-red-50/50 border-red-200' : 'bg-card'}`}>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
            <div className="mt-2">
                <div className={`text-2xl font-bold ${tone === 'danger' ? 'text-red-600' : 'text-foreground'}`}>{value}</div>
                <div className="text-[10px] text-muted-foreground mt-1 truncate">{sub}</div>
            </div>
        </Card>
    );
}

function RoiRow({ label, count, hireRate, ghostRate }: any) {
    return (
        <div className="flex items-center justify-between py-1">
            <div className="flex flex-col">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{count} Apps</span>
            </div>
            <div className="text-right flex items-center gap-3 text-xs">
                <div className="flex flex-col items-end">
                    <span className="font-bold text-emerald-600">{pct(hireRate)}</span>
                    <span className="text-muted-foreground/50">Hire</span>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex flex-col items-end">
                    <span className="font-medium text-muted-foreground">{pct(ghostRate)}</span>
                    <span className="text-muted-foreground/50">Ghost</span>
                </div>
            </div>
        </div>
    );
}

function formatHours(h: number | null) {
    if (h == null) return "—";
    if (h < 24) return `${Math.round(h)}h`;
    return `${(h / 24).toFixed(1)}d`;
}

function pct(x: number | null) {
    if (x == null) return "—";
    return `${Math.round(x * 100)}%`;
}