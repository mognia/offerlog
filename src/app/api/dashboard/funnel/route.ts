import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/auth-guard";
import { getCohortApplicationIds } from "@/lib/dashboard/cohort";
import type { SourceBucket } from "@/lib/dashboard/source-bucket";
import {prisma} from "@/lib/prisma";
import {WorkMode, StageType, ApplicationStatus} from "@/lib/prisma-types";

const ALL_STAGE_TYPES: StageType[] = [
    "APPLIED","RECRUITER_SCREEN","TECH_SCREEN","CULTURAL","TAKE_HOME","ONSITE","HM_CHAT","OFFER","NEGOTIATION","OTHER",
];

const KEY_PATH: Array<StageType> = ["APPLIED","RECRUITER_SCREEN","TECH_SCREEN","ONSITE","OFFER"];

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

    return { from, to, status, workMode, source, sourceBucket };
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
            reachedCounts: Object.fromEntries(ALL_STAGE_TYPES.map((t) => [t, 0])),
            conversions: [],
            offerToHire: { offers: 0, hires: 0, rate: null },
        });
    }

    // application statuses for HIRED
    const hiredIds = new Set(
        (await prisma.application.findMany({
            where: { id: { in: ids }, status: "HIRED" },
            select: { id: true },
        })).map((a) => a.id)
    );

    // scan events once
    const events = await prisma.interviewEvent.findMany({
        where: {
            stage: { applicationId: { in: ids } },
        },
        select: {
            stage: { select: { stageType: true, applicationId: true } },
        },
    });

    const reachedSets = new Map<StageType, Set<string>>();
    for (const t of ALL_STAGE_TYPES) reachedSets.set(t, new Set<string>());

    for (const e of events) {
        const st = e.stage.stageType;
        if (!st) continue;
        reachedSets.get(st)?.add(e.stage.applicationId);
    }

    const reachedCounts = Object.fromEntries(
        ALL_STAGE_TYPES.map((t) => [t, reachedSets.get(t)!.size])
    ) as Record<StageType, number>;

    // conversions along key path, based on reached sets
    const conversions: Array<{
        from: StageType;
        to: StageType;
        fromCount: number;
        toCount: number;
        rate: number | null;
    }> = [];

    for (let i = 0; i < KEY_PATH.length - 1; i++) {
        const a = KEY_PATH[i]!;
        const b = KEY_PATH[i + 1]!;
        const setA = reachedSets.get(a)!;
        const setB = reachedSets.get(b)!;

        const fromCount = setA.size;
        let toCount = 0;
        for (const id of setA) if (setB.has(id)) toCount++;

        conversions.push({
            from: a,
            to: b,
            fromCount,
            toCount,
            rate: fromCount === 0 ? null : toCount / fromCount,
        });
    }

    // OFFER -> HIRED
    const offerSet = reachedSets.get("OFFER")!;
    const offers = offerSet.size;
    let hires = 0;
    for (const id of offerSet) if (hiredIds.has(id)) hires++;

    return NextResponse.json({
        ok: true,
        reachedCounts,
        conversions,
        offerToHire: { offers, hires, rate: offers === 0 ? null : hires / offers },
    });
}
