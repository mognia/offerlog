import type { SourceBucket } from "@/lib/dashboard/source-bucket";
import {ApplicationStatus, WorkMode} from "../../../generated/prisma/enums";

export type DashboardFilters = {
    from: string; // ISO
    to: string;   // ISO
    status?: ApplicationStatus;
    workMode?: WorkMode;
    source?: string;
    sourceBucket?: SourceBucket;
    tzOffsetMinutes: number;
};

export type ActionCenterResponse = {
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
        upcomingFollowupsByDay: Array<{ date: string; count: number }>; // date = YYYY-MM-DD (client local)
    };
};
