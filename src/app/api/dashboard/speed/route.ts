import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/auth-guard";
import { getCohortApplicationIds } from "@/lib/dashboard/cohort";
import { median, p75, toHours } from "@/lib/dashboard/stats";
import type { SourceBucket } from "@/lib/dashboard/source-bucket";
import {ApplicationStatus, WorkMode} from "../../../../../generated/prisma/enums";
import {prisma} from "@/lib/prisma";
import {weekKeyClientLocal} from "@/lib/dashboard/week-key-client";

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
        return NextResponse.json({
            ok: true,
            firstResponse: { medianHours: null, p75Hours: null },
            weeklyTrend: [],
            timeToCloseByStatus: { HIRED: null, REJECTED: null, GHOSTED: null },
        });
    }

    const apps = await prisma.application.findMany({
        where: { id: { in: ids } },
        select: { appliedAt: true, firstResponseAt: true, closedAt: true, status: true },
    });

    // applied -> first response
    const firstRespMs: number[] = [];
    const byWeek = new Map<string, number[]>();

    for (const a of apps) {
        if (a.firstResponseAt) {
            const ms = a.firstResponseAt.getTime() - a.appliedAt.getTime();
            if (ms >= 0) {
                firstRespMs.push(ms);
                const wk = weekKeyClientLocal(a.appliedAt, q.tzOffsetMinutes);
                if (!byWeek.has(wk)) byWeek.set(wk, []);
                byWeek.get(wk)!.push(ms);
            }
        }
    }

    firstRespMs.sort((x, y) => x - y);
    const medianFirst = median(firstRespMs);
    const p75First = p75(firstRespMs);

    const weeklyTrend = Array.from(byWeek.entries())
        .map(([weekStart, vals]) => {
            vals.sort((x, y) => x - y);
            return { weekStart, medianHours: median(vals) == null ? null : toHours(median(vals)!) };
        })
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    // applied -> closed by status
    const closeByStatus: Record<"HIRED" | "REJECTED" | "GHOSTED", number[]> = {
        HIRED: [],
        REJECTED: [],
        GHOSTED: [],
    };

    for (const a of apps) {
        if (!a.closedAt) continue;
        if (a.status !== "HIRED" && a.status !== "REJECTED" && a.status !== "GHOSTED") continue;
        const ms = a.closedAt.getTime() - a.appliedAt.getTime();
        if (ms >= 0) closeByStatus[a.status].push(ms);
    }

    const timeToCloseByStatus = {
        HIRED: (() => {
            const arr = closeByStatus.HIRED.sort((x, y) => x - y);
            const m = median(arr);
            return m == null ? null : toHours(m);
        })(),
        REJECTED: (() => {
            const arr = closeByStatus.REJECTED.sort((x, y) => x - y);
            const m = median(arr);
            return m == null ? null : toHours(m);
        })(),
        GHOSTED: (() => {
            const arr = closeByStatus.GHOSTED.sort((x, y) => x - y);
            const m = median(arr);
            return m == null ? null : toHours(m);
        })(),
    };

    return NextResponse.json({
        ok: true,
        firstResponse: {
            medianHours: medianFirst == null ? null : toHours(medianFirst),
            p75Hours: p75First == null ? null : toHours(p75First),
        },
        weeklyTrend,
        timeToCloseByStatus,
    });
}
