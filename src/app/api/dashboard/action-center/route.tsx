import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/auth-guard";
import { deriveSourceBucket, type SourceBucket } from "@/lib/dashboard/source-bucket";
import { addDays, diffDaysCeil, diffDaysFloor, getClientDayBoundsUtc } from "@/lib/dashboard/tz";
import {prisma} from "@/lib/prisma";
import {ApplicationStatus, StageType, WorkMode} from "../../../../../generated/prisma/enums";


type ActionCenterQuery = {
    from: string;
    to: string;
    status?: ApplicationStatus;
    workMode?: WorkMode;
    source?: string;
    sourceBucket?: SourceBucket;
    tzOffsetMinutes: number;
};

function parseQuery(req: Request): ActionCenterQuery {
    const url = new URL(req.url);

    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    const status = (url.searchParams.get("status") ?? undefined) as ApplicationStatus | undefined;
    const workMode = (url.searchParams.get("workMode") ?? undefined) as WorkMode | undefined;
    const source = url.searchParams.get("source") ?? undefined;
    const sourceBucket = (url.searchParams.get("sourceBucket") ?? undefined) as SourceBucket | undefined;

    const tzOffsetRaw = url.searchParams.get("tzOffsetMinutes");
    const tzOffsetMinutes = Number(tzOffsetRaw);

    if (!from || !to) throw new Error("Missing from/to");
    if (!Number.isFinite(tzOffsetMinutes)) throw new Error("Missing tzOffsetMinutes");

    return { from, to, status, workMode, source, sourceBucket, tzOffsetMinutes };
}

function stageLabel(stageType: StageType | null, title: string) {
    return stageType ? stageType : title;
}

export async function GET(req: Request) {
    const userId = await requireUserId();

    let q: ActionCenterQuery;
    try {
        q = parseQuery(req);
    } catch {
        return NextResponse.json({ ok: false, error: "Invalid query" }, { status: 400 });
    }

    const from = new Date(q.from);
    const to = new Date(q.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        return NextResponse.json({ ok: false, error: "Invalid from/to" }, { status: 400 });
    }

    const now = new Date();
    const { startUtc: todayStartUtc, endUtc: tomorrowStartUtc } = getClientDayBoundsUtc(now, q.tzOffsetMinutes);

    // Cohort: appliedAt within [from, to]
    const baseWhere = {
        userId,
        appliedAt: { gte: from, lte: to },
        ...(q.status ? { status: q.status } : {}),
        ...(q.workMode ? { workMode: q.workMode } : {}),
        ...(q.source
            ? {
                source: {
                    contains: q.source,
                    mode: "insensitive" as const,
                },
            }
            : {}),
    };

    // Step 1, fetch ids + source for bucket filtering (no DB changes)
    const cohortApps = await prisma.application.findMany({
        where: baseWhere,
        select: { id: true, source: true },
    });

    const idsAll = cohortApps.map((a) => a.id);

    const ids =
        q.sourceBucket
            ? cohortApps.filter((a) => deriveSourceBucket(a.source) === q.sourceBucket).map((a) => a.id)
            : idsAll;

    if (ids.length === 0) {
        return NextResponse.json({
            ok: true,
            kpis: {
                countsByStatus: { OPEN: 0, HIRED: 0, REJECTED: 0, GHOSTED: 0 },
                overdueFollowupsCount: 0,
                dueTodayFollowupsCount: 0,
                staleOpenCount7: 0,
                staleOpenCount14: 0,
                staleOpenCount21: 0,
                noResponseRiskCount: 0,
                noActivityRiskCount: 0,
            },
            lists: {
                overdueFollowups: [],
                dueTodayFollowups: [],
                staleOpenApps: [],
                noResponseRiskApps: [],
                noActivityRiskApps: [],
            },
            charts: { upcomingFollowupsByDay: [] },
        });
    }

    // Counts by status (within cohort ids)
    const statusGroups = await prisma.application.groupBy({
        by: ["status"],
        where: { id: { in: ids } },
        _count: { _all: true },
    });

    const countsByStatus = {
        OPEN: 0,
        HIRED: 0,
        REJECTED: 0,
        GHOSTED: 0,
    } satisfies Record<ApplicationStatus, number>;

    for (const g of statusGroups) countsByStatus[g.status] = g._count._all;

    // Follow-ups, not done, within cohort
    // Due today: followUpAt in [todayStartUtc, tomorrowStartUtc)
    const dueTodayEvents = await prisma.interviewEvent.findMany({
        where: {
            followUpAt: { gte: todayStartUtc, lt: tomorrowStartUtc },
            followUpDoneAt: null,
            stage: { applicationId: { in: ids } },
        },
        orderBy: { followUpAt: "asc" },
        take: 10,
        select: {
            followUpAt: true,
            stage: {
                select: {
                    title: true,
                    stageType: true,
                    application: { select: { id: true, companyName: true, roleTitle: true } },
                },
            },
        },
    });

    const dueTodayFollowupsCount = await prisma.interviewEvent.count({
        where: {
            followUpAt: { gte: todayStartUtc, lt: tomorrowStartUtc },
            followUpDoneAt: null,
            stage: { applicationId: { in: ids } },
        },
    });

    // Overdue: followUpAt < todayStartUtc (not done)
    const overdueEvents = await prisma.interviewEvent.findMany({
        where: {
            followUpAt: { lt: todayStartUtc },
            followUpDoneAt: null,
            stage: { applicationId: { in: ids } },
        },
        orderBy: { followUpAt: "asc" },
        take: 10,
        select: {
            followUpAt: true,
            stage: {
                select: {
                    title: true,
                    stageType: true,
                    application: { select: { id: true, companyName: true, roleTitle: true } },
                },
            },
        },
    });

    const overdueFollowupsCount = await prisma.interviewEvent.count({
        where: {
            followUpAt: { lt: todayStartUtc },
            followUpDoneAt: null,
            stage: { applicationId: { in: ids } },
        },
    });

    // Upcoming follow-ups by day, next 7 client-days (including today)
    const rangeStartUtc = todayStartUtc;
    const rangeEndUtc = addDays(rangeStartUtc, 7);

    const upcoming = await prisma.interviewEvent.findMany({
        where: {
            followUpAt: { gte: rangeStartUtc, lt: rangeEndUtc },
            followUpDoneAt: null,
            stage: { applicationId: { in: ids } },
        },
        select: { followUpAt: true },
    });

    // Build 7 buckets in client local days
    const offsetMs = q.tzOffsetMinutes * 60 * 1000;
    const startLocalMs = rangeStartUtc.getTime() - offsetMs;

    const dayKeys: string[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startLocalMs + i * 24 * 60 * 60 * 1000);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        dayKeys.push(`${yyyy}-${mm}-${dd}`);
    }

    const counts = new Map(dayKeys.map((k) => [k, 0]));

    for (const e of upcoming) {
        if (!e.followUpAt) continue;
        const local = new Date(e.followUpAt.getTime() - offsetMs);
        const yyyy = local.getFullYear();
        const mm = String(local.getMonth() + 1).padStart(2, "0");
        const dd = String(local.getDate()).padStart(2, "0");
        const key = `${yyyy}-${mm}-${dd}`;
        if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const upcomingFollowupsByDay = dayKeys.map((date) => ({
        date, // YYYY-MM-DD in client local
        count: counts.get(date) ?? 0,
    }));

    // Stale OPEN (based on lastActivityAt)
    const stale7 = addDays(now, -7);
    const stale14 = addDays(now, -14);
    const stale21 = addDays(now, -21);

    const [staleOpenCount7, staleOpenCount14, staleOpenCount21] = await Promise.all([
        prisma.application.count({
            where: { id: { in: ids }, status: "OPEN", lastActivityAt: { lte: stale7 } },
        }),
        prisma.application.count({
            where: { id: { in: ids }, status: "OPEN", lastActivityAt: { lte: stale14 } },
        }),
        prisma.application.count({
            where: { id: { in: ids }, status: "OPEN", lastActivityAt: { lte: stale21 } },
        }),
    ]);

    // Risk thresholds
    const N = 7;
    const appliedBefore = addDays(now, -N);

    const noResponseRiskCount = await prisma.application.count({
        where: {
            id: { in: ids },
            status: "OPEN",
            firstResponseAt: null,
            appliedAt: { lte: appliedBefore },
        },
    });

    const noActivityRiskCount = await prisma.application.count({
        where: {
            id: { in: ids },
            status: "OPEN",
            appliedAt: { lte: appliedBefore },
            // "no interview events at all"
            stages: { every: { events: { none: {} } } },
        },
    });

    // Lists
    const staleOpenApps = await prisma.application.findMany({
        where: { id: { in: ids }, status: "OPEN" },
        orderBy: { lastActivityAt: "asc" }, // stalest first
        take: 10,
        select: { id: true, companyName: true, roleTitle: true, lastActivityAt: true },
    });

    const noResponseRiskApps = await prisma.application.findMany({
        where: {
            id: { in: ids },
            status: "OPEN",
            firstResponseAt: null,
            appliedAt: { lte: appliedBefore },
        },
        orderBy: { appliedAt: "asc" },
        take: 10,
        select: { id: true, companyName: true, roleTitle: true, appliedAt: true },
    });

    const noActivityRiskApps = await prisma.application.findMany({
        where: {
            id: { in: ids },
            status: "OPEN",
            appliedAt: { lte: appliedBefore },
            stages: { every: { events: { none: {} } } },
        },
        orderBy: { appliedAt: "asc" },
        take: 10,
        select: { id: true, companyName: true, roleTitle: true, appliedAt: true },
    });

    // Shape response objects
    const overdueFollowups = overdueEvents.map((e) => ({
        appId: e.stage.application.id,
        companyName: e.stage.application.companyName,
        roleTitle: e.stage.application.roleTitle,
        stage: stageLabel(e.stage.stageType ?? null, e.stage.title),
        followUpAt: e.followUpAt!.toISOString(),
        daysOverdue: diffDaysCeil(todayStartUtc, e.followUpAt!),
    }));

    const dueTodayFollowups = dueTodayEvents.map((e) => ({
        appId: e.stage.application.id,
        companyName: e.stage.application.companyName,
        roleTitle: e.stage.application.roleTitle,
        stage: stageLabel(e.stage.stageType ?? null, e.stage.title),
        followUpAt: e.followUpAt!.toISOString(),
        daysOverdue: 0,
    }));

    const staleOpenAppsOut = staleOpenApps.map((a) => ({
        appId: a.id,
        companyName: a.companyName,
        roleTitle: a.roleTitle,
        daysSinceLastActivity: diffDaysFloor(now, a.lastActivityAt),
    }));

    const noResponseRiskAppsOut = noResponseRiskApps.map((a) => ({
        appId: a.id,
        companyName: a.companyName,
        roleTitle: a.roleTitle,
        daysSinceApplied: diffDaysFloor(now, a.appliedAt),
    }));

    const noActivityRiskAppsOut = noActivityRiskApps.map((a) => ({
        appId: a.id,
        companyName: a.companyName,
        roleTitle: a.roleTitle,
        daysSinceApplied: diffDaysFloor(now, a.appliedAt),
    }));

    return NextResponse.json({
        ok: true,
        kpis: {
            countsByStatus,
            overdueFollowupsCount,
            dueTodayFollowupsCount,
            staleOpenCount7,
            staleOpenCount14,
            staleOpenCount21,
            noResponseRiskCount,
            noActivityRiskCount,
        },
        lists: {
            overdueFollowups,
            dueTodayFollowups,
            staleOpenApps: staleOpenAppsOut,
            noResponseRiskApps: noResponseRiskAppsOut,
            noActivityRiskApps: noActivityRiskAppsOut,
        },
        charts: {
            upcomingFollowupsByDay,
        },
    });
}
