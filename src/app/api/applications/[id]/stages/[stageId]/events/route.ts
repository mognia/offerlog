import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {requireUserId} from "@/lib/auth/auth-guard";
import z from "zod";

export async function GET(
    _req: Request,
    ctx: { params: Promise<{ id: string; stageId: string }> }
) {
    const userId = await requireUserId();
    const { id: applicationId, stageId } = await ctx.params;

    const stage = await prisma.interviewStage.findFirst({
        where: {
            id: stageId,
            applicationId,
            application: { userId }, // security-critical: stage must belong to user's application
        },
        select: { id: true },
    });
    if (!stage) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const events = await prisma.interviewEvent.findMany({
        where: { stageId },
        orderBy: { occurredAt: "desc" },
        select: {
            id: true,
            occurredAt: true,
            channel: true,
            direction: true,
            notes: true,
            feedback: true,
            nextTalkingPoints: true,
            followUpAt: true,
            followUpDoneAt: true,
            outcome: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    const now = Date.now();
    const withFlags = events.map((e) => ({
        ...e,
        isOverdue: !!(e.followUpAt && e.followUpAt.getTime() < now && !e.followUpDoneAt),
    }));

    return NextResponse.json({ ok: true, events: withFlags });
}

const channelEnum = z.enum(["EMAIL", "CALL", "VIDEO", "ONSITE", "CHAT", "OTHER"]);
const directionEnum = z.enum(["INBOUND", "OUTBOUND", "UNKNOWN"]);
const outcomeEnum = z.enum(["PASS", "FAIL", "PENDING"]);

const createEventSchema = z.object({
    occurredAt: z.coerce.date(),
    channel: channelEnum,
    direction: directionEnum.optional(),
    notes: z.string().min(1).max(4000),
    feedback: z.string().max(4000).optional(),
    nextTalkingPoints: z.string().max(4000).optional(),
    followUpAt: z.coerce.date().optional(),
    followUpDoneAt: z.coerce.date().optional(),
    outcome: outcomeEnum.optional(),
});

export async function POST(
    req: Request,
    ctx: { params: Promise<{ id: string; stageId: string }> }
) {
    const userId = await requireUserId();
    const { id: applicationId, stageId } = await ctx.params;

    const app = await prisma.application.findFirst({
        where: { id: applicationId, userId },
        select: { id: true, status: true },
    });
    if (!app) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (app.status === "REJECTED" || app.status === "GHOSTED") {
        return NextResponse.json({ ok: false, error: "Closed applications cannot add events." }, { status: 409 });
    }

    const stage = await prisma.interviewStage.findFirst({
        where: { id: stageId, applicationId },
        select: { id: true },
    });
    if (!stage) return NextResponse.json({ ok: false, error: "Stage not found" }, { status: 404 });

    const input = createEventSchema.parse(await req.json().catch(() => null));

    const created = await prisma.$transaction(async (tx) => {
        const ev = await tx.interviewEvent.create({
            data: {
                stageId,
                occurredAt: input.occurredAt,
                channel: input.channel,
                direction: input.direction ?? "UNKNOWN",
                notes: input.notes.trim(), // required
                feedback: input.feedback?.trim() ?? null,
                nextTalkingPoints: input.nextTalkingPoints?.trim() ?? null,
                followUpAt: input.followUpAt ?? null,
                followUpDoneAt: input.followUpDoneAt ?? null,
                outcome: input.outcome ?? null,
            },
            select: {
                id: true,
                occurredAt: true,
                channel: true,
                direction: true,
                followUpAt: true,
                followUpDoneAt: true,
                outcome: true,
                createdAt: true,
            },
        });

        await tx.application.update({
            where: { id: applicationId },
            data: { lastActivityAt: new Date() },
        });

        return ev;
    });

    return NextResponse.json({ ok: true, event: created }, { status: 201 });
}