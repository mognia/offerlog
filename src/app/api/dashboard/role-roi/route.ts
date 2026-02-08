import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/auth-guard";
import { getCohortApplicationIds } from "@/lib/dashboard/cohort";
import { median } from "@/lib/dashboard/stats";
import type { ApplicationStatus, WorkMode } from "@/lib/prisma-types";
import type { SourceBucket } from "@/lib/dashboard/source-bucket";
import {prisma} from "@/lib/prisma";

function parse(req: Request) {
    const url = new URL(req.url);
    const from = new Date(url.searchParams.get("from") ?? "");
    const to = new Date(url.searchParams.get("to") ?? "");
    const tzOffsetMinutes = Number(url.searchParams.get("tzOffsetMinutes"));

    const status = (url.searchParams.get("status") ?? undefined) as ApplicationStatus | undefined;
    const workMode = (url.searchParams.get("workMode") ?? undefined) as WorkMode | undefined;
    const source = url.searchParams.get("source") ?? undefined;
    const sourceBucket = (url.searchParams.get("sourceBucket") ?? undefined) as SourceBucket | undefined;

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) throw new Error("bad range");
    if (!Number.isFinite(tzOffsetMinutes)) throw new Error("missing tz offset");

    return { from, to, tzOffsetMinutes, status, workMode, source, sourceBucket };
}

function msToHours(ms: number) {
    return ms / (1000 * 60 * 60);
}

export async function GET(req: Request) {
    const userId = await requireUserId();

    let q: ReturnType<typeof parse>;
    try { q = parse(req); } catch {
        return NextResponse.json({ ok: false, error: "Invalid query" }, { status: 400 });
    }

    const ids = await getCohortApplicationIds({
        userId,
        from: q.from,
        to: q.to,
        status: q.status,
        workMode: q.workMode,
        source: q.source,
        sourceBucket: q.sourceBucket,
    });

    if (ids.length === 0) {
        return NextResponse.json({ ok: true, roles: [] });
    }

    // Pull minimal application data
    const apps = await prisma.application.findMany({
        where: { id: { in: ids } },
        select: {
            id: true,
            roleTitle: true,
            status: true,
            appliedAt: true,
            firstResponseAt: true,
        },
    });

    // Count events per application without N+1
    const eventCounts = await prisma.interviewEvent.groupBy({
        by: ["stageId"],
        where: { stage: { applicationId: { in: ids } } },
        _count: { _all: true },
    });

    // stageId -> applicationId mapping (single query)
    const stages = await prisma.interviewStage.findMany({
        where: { applicationId: { in: ids } },
        select: { id: true, applicationId: true },
    });
    const stageToApp = new Map(stages.map((s) => [s.id, s.applicationId]));
    const appEventCount = new Map<string, number>();
    for (const g of eventCounts) {
        const appId = stageToApp.get(g.stageId);
        if (!appId) continue;
        appEventCount.set(appId, (appEventCount.get(appId) ?? 0) + g._count._all);
    }

    // Group by roleTitle normalized
    type RoleAgg = {
        key: string;         // normalized
        display: string;     // first seen trimmed
        appIds: string[];
        count: number;
        hires: number;
        ghosts: number;
        respMs: number[];
        eventsPerApp: number[];
    };

    const map = new Map<string, RoleAgg>();

    for (const a of apps) {
        const display = (a.roleTitle ?? "").trim() || "Unknown role";
        const key = display.toLowerCase();

        if (!map.has(key)) {
            map.set(key, {
                key,
                display,
                appIds: [],
                count: 0,
                hires: 0,
                ghosts: 0,
                respMs: [],
                eventsPerApp: [],
            });
        }

        const r = map.get(key)!;
        r.appIds.push(a.id);
        r.count++;

        if (a.status === "HIRED") r.hires++;
        if (a.status === "GHOSTED") r.ghosts++;

        if (a.firstResponseAt) {
            const ms = a.firstResponseAt.getTime() - a.appliedAt.getTime();
            if (ms >= 0) r.respMs.push(ms);
        }

        r.eventsPerApp.push(appEventCount.get(a.id) ?? 0);
    }

    const roles = Array.from(map.values()).map((r) => {
        r.respMs.sort((x, y) => x - y);
        r.eventsPerApp.sort((x, y) => x - y);

        const medResp = median(r.respMs);
        const medEvents = median(r.eventsPerApp);

        // Heuristic flag: high effort low return
        // - median events >= 3 AND hireRate == 0 (within this cohort)
        const hireRate = r.count === 0 ? null : r.hires / r.count;
        const highEffortLowReturn = (medEvents ?? 0) >= 3 && (hireRate ?? 0) === 0;

        return {
            roleTitle: r.display,
            key: r.key,
            count: r.count,
            hireRate,
            ghostRate: r.count === 0 ? null : r.ghosts / r.count,
            medianFirstResponseHours: medResp == null ? null : msToHours(medResp),
            medianEventsPerApplication: medEvents,
            highEffortLowReturn,
        };
    });

    // Default sort: highest volume first
    roles.sort((a, b) => b.count - a.count);

    return NextResponse.json({ ok: true, roles });
}
