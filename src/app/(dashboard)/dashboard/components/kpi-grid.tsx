import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Clock, XCircle, Ghost } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiGridProps {
    loading: boolean;
    data: any; // Ideally strictly typed from response types
}

export function KpiGrid({ loading, data }: KpiGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    if (!data) return null;

    const kpis = data.kpis;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
                label="Active Applications"
                value={kpis.countsByStatus.OPEN}
                icon={<Clock className="h-5 w-5 text-blue-500" />}
                trend="Current Pipeline"
            />
            <KpiCard
                label="Hired"
                value={kpis.countsByStatus.HIRED}
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                trend="Success"
                className="bg-emerald-500/5 border-emerald-500/20"
            />
            <KpiCard
                label="Rejected"
                value={kpis.countsByStatus.REJECTED}
                icon={<XCircle className="h-5 w-5 text-red-500" />}
                trend="Closed"
            />
            <KpiCard
                label="Ghosted"
                value={kpis.countsByStatus.GHOSTED}
                icon={<Ghost className="h-5 w-5 text-slate-500" />}
                trend="No Response"
            />

            {/* Risk Metrics Row */}
            <KpiCard
                label="Action Required"
                value={kpis.overdueFollowupsCount + kpis.dueTodayFollowupsCount}
                icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
                trend={`${kpis.overdueFollowupsCount} Overdue`}
                className="bg-orange-500/5 border-orange-500/20"
            />
            <KpiCard
                label="Stale Applications"
                value={kpis.staleOpenCount7}
                hint="No activity > 7 days"
            />
            <KpiCard
                label="At Risk (No Response)"
                value={kpis.noResponseRiskCount}
                hint="> 7 days w/o reply"
            />
            <KpiCard
                label="Zero Activity"
                value={kpis.noActivityRiskCount}
                hint="Applied but no logs"
            />
        </div>
    );
}

function KpiCard({ label, value, icon, trend, hint, className }: any) {
    return (
        <Card className={cn("p-5 flex flex-col justify-between rounded-2xl border shadow-sm transition-all hover:shadow-md", className)}>
            <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                {icon && <div className="p-2 bg-background rounded-full border shadow-sm">{icon}</div>}
            </div>
            <div className="mt-4">
                <span className="text-3xl font-bold tracking-tight">{value}</span>
                {trend && <p className="text-xs font-medium text-muted-foreground mt-1">{trend}</p>}
                {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
            </div>
        </Card>
    );
}