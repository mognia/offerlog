import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/auth-guard";
import { getCohortApplicationIds } from "@/lib/dashboard/cohort";
import { deriveSourceBucket, type SourceBucket } from "@/lib/dashboard/source-bucket";
import { median } from "@/lib/dashboard/stats";
import type { ApplicationStatus, WorkMode } from "@/lib/prisma-types";
import {prisma} from "@/lib/prisma";

type RoiRow = {
    key: string;
    count: number;
    hireRate: number | null;
    ghostRate: number | null;
    medianFirstResponseHours: number | null;
};

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
        return NextResponse.json({
            ok: true,
            byWorkMode: [],
            bySourceBucket: [],
            topRawSourcesByBucket: {},
        });
    }

    const apps = await prisma.application.findMany({
        where: { id: { in: ids } },
        select: {
            id: true,
            status: true,
            workMode: true,
            source: true,
            appliedAt: true,
            firstResponseAt: true,
        },
    });

    // Top raw sources per bucket (counts of raw strings)
    const topRawSourcesByBucket: Record<SourceBucket, Array<{ source: string; count: number }>> = {
        LINKEDIN: [],
        REFERRAL: [],
        RECRUITER: [],
        COMPANY_SITE: [],
        JOB_BOARD: [],
        OTHER: [],
    };

    const rawCount = new Map<string, number>(); // key = `${bucket}||${raw}`
    for (const a of apps) {
        const bucket = deriveSourceBucket(a.source);
        const raw = (a.source ?? "").trim() || "(empty)";
        const key = `${bucket}||${raw.toLowerCase()}`; // normalize for counting
        rawCount.set(key, (rawCount.get(key) ?? 0) + 1);
    }

    for (const [k, count] of rawCount.entries()) {
        const [bucket, rawLower] = k.split("||") as [SourceBucket, string];
        // store rawLower as "source" to keep deterministic; optionally you can keep original casing later.
        topRawSourcesByBucket[bucket].push({ source: rawLower, count });
    }
    for (const b of Object.keys(topRawSourcesByBucket) as SourceBucket[]) {
        topRawSourcesByBucket[b] = topRawSourcesByBucket[b]
            .sort((a, c) => c.count - a.count)
            .slice(0, 5);
    }

    // ROI aggregation helper
    function computeRows(groupKeyFn: (a: typeof apps[number]) => string | null | undefined): RoiRow[] {
        const groups = new Map<string, typeof apps>();

        for (const a of apps) {
            const key = groupKeyFn(a);
            const k = (key ?? "UNKNOWN").toString();
            if (!groups.has(k)) groups.set(k, []);
            groups.get(k)!.push(a);
        }

        const rows: RoiRow[] = [];
        for (const [key, arr] of groups.entries()) {
            const count = arr.length;
            const hires = arr.filter((x) => x.status === "HIRED").length;
            const ghosts = arr.filter((x) => x.status === "GHOSTED").length;

            const respMs: number[] = [];
            for (const x of arr) {
                if (!x.firstResponseAt) continue;
                const ms = x.firstResponseAt.getTime() - x.appliedAt.getTime();
                if (ms >= 0) respMs.push(ms);
            }
            respMs.sort((x, y) => x - y);
            const med = median(respMs);

            rows.push({
                key,
                count,
                hireRate: count === 0 ? null : hires / count,
                ghostRate: count === 0 ? null : ghosts / count,
                medianFirstResponseHours: med == null ? null : msToHours(med),
            });
        }

        return rows.sort((a, b) => b.count - a.count);
    }

    const byWorkMode = computeRows((a) => a.workMode ?? "UNKNOWN");

    const bySourceBucket = computeRows((a) => deriveSourceBucket(a.source));

    return NextResponse.json({
        ok: true,
        byWorkMode,
        bySourceBucket,
        topRawSourcesByBucket,
    });
}
