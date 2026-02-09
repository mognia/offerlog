import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Timer, Filter, Target, ArrowDown } from "lucide-react";

interface ChartsSectionProps {
    speedLoading: boolean;
    speedData: any;
    funnelLoading: boolean;
    funnelData: any;
    outcomesLoading: boolean;
    outcomesData: any;
}

export function ChartsSection({
                                  speedLoading,
                                  speedData,
                                  funnelLoading,
                                  funnelData,
                                  outcomesLoading,
                                  outcomesData,
                              }: ChartsSectionProps) {
    if (speedLoading || funnelLoading || outcomesLoading) {
        return <Skeleton className="h-96 w-full rounded-2xl" />;
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* 1. SPEED COLUMN */}
            <div className="space-y-6">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    <Timer className="h-4 w-4" /> Velocity
                </h3>

                {/* First Response Card */}
                <Card className="rounded-2xl border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">First Response Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">
                 {formatHours(speedData?.firstResponse?.medianHours)}
              </span>
                            <span className="text-sm text-muted-foreground">median</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            P75: {formatHours(speedData?.firstResponse?.p75Hours)}
                        </p>

                        <div className="mt-6">
                            <div className="text-xs font-semibold mb-2 text-muted-foreground">Weekly Trend</div>
                            <TinyTrend points={speedData?.weeklyTrend?.map((p: any) => ({ x: p.weekStart, y: p.medianHours })) || []} />
                        </div>
                    </CardContent>
                </Card>

                {/* Time to Close */}
                <Card className="rounded-2xl border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Time to Close</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <MetricRow label="Hired" value={formatHours(speedData?.timeToCloseByStatus?.HIRED)} />
                        <MetricRow label="Rejected" value={formatHours(speedData?.timeToCloseByStatus?.REJECTED)} />
                        <MetricRow label="Ghosted" value={formatHours(speedData?.timeToCloseByStatus?.GHOSTED)} />
                    </CardContent>
                </Card>
            </div>

            {/* 2. FUNNEL COLUMN */}
            <div className="space-y-6">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    <Filter className="h-4 w-4" /> Pipeline Health
                </h3>

                <Card className="rounded-2xl border shadow-sm ">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Conversion Funnel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 relative">
                        {/* Funnel Steps */}
                        {funnelData?.conversions?.map((c: any, i: number) => (
                            <div key={i} className="relative z-10">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-xs font-bold uppercase text-muted-foreground">{c.from}</span>
                                    <span className="text-xs font-bold uppercase text-muted-foreground">{c.to}</span>
                                </div>
                                <div className="h-10 bg-muted/40 rounded-lg flex items-center justify-between px-3 border border-border/50">
                                    <span className="text-sm font-medium">{c.fromCount}</span>
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs font-bold text-primary">{pct(c.rate)}</span>
                                        <ArrowDown className="h-3 w-3 text-muted-foreground/50" />
                                    </div>
                                    <span className="text-sm font-medium">{c.toCount}</span>
                                </div>
                            </div>
                        ))}

                        <Separator />

                        {/* Offer to Hire */}
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400">Offer → Hire</span>
                                <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-100/50">
                                    {pct(funnelData?.offerToHire?.rate)} Success
                                </Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>{funnelData?.offerToHire?.offers} Offers</span>
                                <span className="font-bold">{funnelData?.offerToHire?.hires} Hires</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. OUTCOMES COLUMN */}
            <div className="space-y-6">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    <Target className="h-4 w-4" /> Drop-off Analysis
                </h3>

                <Card className="rounded-2xl border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Top Drop-off Stages</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {outcomesData?.topDropoffStages?.length ? (
                            outcomesData.topDropoffStages.map((x: any) => (
                                <div key={x.stageType} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                                    <span className="text-sm font-medium">{x.stageType}</span>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-red-600 dark:text-red-400">{x.failCount} Fails</div>
                                        <div className="text-[10px] text-muted-foreground">Rate: {pct(x.failRate)}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-muted-foreground py-4 text-center">No drop-off data available.</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Outcomes by Channel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {(["EMAIL", "CALL", "VIDEO", "ONSITE"] as const).map((ch) => {
                            const row = outcomesData?.byChannel?.[ch] || { PASS: 0, FAIL: 0, PENDING: 0 };
                            const total = row.PASS + row.FAIL + row.PENDING;
                            if (total === 0) return null;

                            return (
                                <div key={ch} className="flex items-center justify-between text-sm py-1 border-b last:border-0 border-dashed">
                                    <span className="capitalize text-muted-foreground">{ch.toLowerCase()}</span>
                                    <div className="flex gap-2 text-xs">
                                        <span className="text-emerald-600 font-medium">{row.PASS} Pass</span>
                                        <span className="text-red-600 font-medium">{row.FAIL} Fail</span>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// --- Visual Helpers ---

function MetricRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="font-medium text-sm">{value}</span>
        </div>
    );
}

function TinyTrend(props: { points: Array<{ x: string; y: number | null }> }) {
    const vals = props.points.map((p) => p.y).filter((v): v is number => v != null);
    const max = Math.max(1, ...vals);
    return (
        <div className="flex items-end gap-1 h-12 w-full">
            {props.points.map((p) => {
                const h = p.y == null ? 2 : Math.round((p.y / max) * 48);
                return (
                    <div key={p.x} className="flex-1 bg-muted rounded-sm overflow-hidden relative group">
                        <div className="w-full bg-primary/80 absolute bottom-0 rounded-t-sm transition-all group-hover:bg-primary" style={{ height: `${Math.max(2, h)}px` }} />
                    </div>
                );
            })}
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