import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/auth-guard";
import { getCohortApplicationIds } from "@/lib/dashboard/cohort";
import type { SourceBucket } from "@/lib/dashboard/source-bucket";
import {prisma} from "@/lib/prisma";
import {WorkMode, ApplicationStatus} from "@/lib/prisma-types";

function parse(req: Request) {
    const url = new URL(req.url);
    const from = new Date(url.searchParams.get("from") ?? "");
    const to = new Date(url.searchParams.get("to") ?? "");
    const tzOffsetMinutes = Number(url.searchParams.get("tzOffsetMinutes")); // unused here but kept consistent

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
            rates: {
                followUpSetRate: null,
                onTimeFollowUpCompletionRate: null,
                avgLateHours: null,
                feedbackCoverageRate: null,
                nextTalkingPointsCoverageRate: null,
            },
            counts: {
                pendingEvents: 0,
                pendingWithFollowUp: 0,
                followUpsDone: 0,
                followUpsOnTime: 0,
                lateCount: 0,
                withFeedback: 0,
                withNextTalkingPoints: 0,
                totalEvents: 0,
            },
        });
    }

    const events = await prisma.interviewEvent.findMany({
        where: { stage: { applicationId: { in: ids } } },
        select: {
            outcome: true,
            followUpAt: true,
            followUpDoneAt: true,
            feedback: true,
            nextTalkingPoints: true,
        },
    });

    const totalEvents = events.length;

    let pendingEvents = 0;
    let pendingWithFollowUp = 0;

    let followUpsDone = 0;
    let followUpsOnTime = 0;

    let lateCount = 0;
    let lateMsSum = 0;

    let withFeedback = 0;
    let withNextTalkingPoints = 0;

    for (const e of events) {
        if ((e.outcome ?? "PENDING") === "PENDING") {
            pendingEvents++;
            if (e.followUpAt) pendingWithFollowUp++;
        }

        if (e.followUpAt && e.followUpDoneAt) {
            followUpsDone++;
            if (e.followUpDoneAt.getTime() <= e.followUpAt.getTime()) {
                followUpsOnTime++;
            } else {
                lateCount++;
                lateMsSum += (e.followUpDoneAt.getTime() - e.followUpAt.getTime());
            }
        }

        if (e.feedback && e.feedback.trim()) withFeedback++;
        if (e.nextTalkingPoints && e.nextTalkingPoints.trim()) withNextTalkingPoints++;
    }

    const followUpSetRate = pendingEvents === 0 ? null : pendingWithFollowUp / pendingEvents;
    const onTimeRate = followUpsDone === 0 ? null : followUpsOnTime / followUpsDone;
    const avgLateHours = lateCount === 0 ? null : (lateMsSum / lateCount) / (1000 * 60 * 60);

    const feedbackCoverageRate = totalEvents === 0 ? null : withFeedback / totalEvents;
    const nextTalkingPointsCoverageRate = totalEvents === 0 ? null : withNextTalkingPoints / totalEvents;

    return NextResponse.json({
        ok: true,
        rates: {
            followUpSetRate,
            onTimeFollowUpCompletionRate: onTimeRate,
            avgLateHours,
            feedbackCoverageRate,
            nextTalkingPointsCoverageRate,
        },
        counts: {
            pendingEvents,
            pendingWithFollowUp,
            followUpsDone,
            followUpsOnTime,
            lateCount,
            withFeedback,
            withNextTalkingPoints,
            totalEvents,
        },
    });
}
