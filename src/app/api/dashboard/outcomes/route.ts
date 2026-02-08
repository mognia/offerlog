import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/auth-guard";
import { getCohortApplicationIds } from "@/lib/dashboard/cohort";
import type { ApplicationStatus, EventOutcome, InterviewChannel, StageType, WorkMode } from "@/lib/prisma-types";
import type { SourceBucket } from "@/lib/dashboard/source-bucket";
import {prisma} from "@/lib/prisma";

const OUTCOMES: EventOutcome[] = ["PASS","FAIL","PENDING"];
const CHANNELS: InterviewChannel[] = ["EMAIL","CALL","CHAT","ONSITE","VIDEO","OTHER"];
const STAGES: StageType[] = [
    "APPLIED","RECRUITER_SCREEN","TECH_SCREEN","CULTURAL","TAKE_HOME","ONSITE","HM_CHAT","OFFER","NEGOTIATION","OTHER",
];

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

function initStageOutcomeMap() {
    const map: Record<StageType, Record<EventOutcome, number>> = {} as any;
    for (const s of STAGES) {
        map[s] = { PASS: 0, FAIL: 0, PENDING: 0 };
    }
    return map;
}

function initChannelOutcomeMap() {
    const map: Record<InterviewChannel, Record<EventOutcome, number>> = {} as any;
    for (const c of CHANNELS) {
        map[c] = { PASS: 0, FAIL: 0, PENDING: 0 };
    }
    return map;
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
            byStageType: initStageOutcomeMap(),
            byChannel: initChannelOutcomeMap(),
            topDropoffStages: [],
        });
    }

    const events = await prisma.interviewEvent.findMany({
        where: { stage: { applicationId: { in: ids } } },
        select: {
            outcome: true,
            channel: true,
            stage: { select: { stageType: true } },
        },
    });

    const byStageType = initStageOutcomeMap();
    const byChannel = initChannelOutcomeMap();

    for (const e of events) {
        const st = e.stage.stageType;
        if (!st) continue;

        const o: EventOutcome = (e.outcome ?? "PENDING");
        byStageType[st][o] += 1;
        byChannel[e.channel][o] += 1;
    }

    const topDropoffStages = STAGES
        .map((st) => {
            const pass = byStageType[st].PASS;
            const fail = byStageType[st].FAIL;
            const pending = byStageType[st].PENDING;
            const total = pass + fail + pending;
            const failRate = total === 0 ? null : fail / total;
            return { stageType: st, failCount: fail, failRate, total };
        })
        .filter((x) => x.total > 0)
        .sort((a, b) => (b.failCount - a.failCount) || ((b.failRate ?? 0) - (a.failRate ?? 0)))
        .slice(0, 5)
        .map(({ stageType, failCount, failRate }) => ({ stageType, failCount, failRate }));

    return NextResponse.json({
        ok: true,
        byStageType,
        byChannel,
        topDropoffStages,
    });
}
