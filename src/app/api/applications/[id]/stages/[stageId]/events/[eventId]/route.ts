import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {requireUserId} from "@/lib/auth/auth-guard";

const channelEnum = z.enum(["EMAIL", "CALL", "VIDEO", "ONSITE", "CHAT", "OTHER"]);
const directionEnum = z.enum(["INBOUND", "OUTBOUND", "UNKNOWN"]);
const outcomeEnum = z.enum(["PASS", "FAIL", "PENDING"]); // adjust to your Prisma enum

const patchSchema = z
    .object({
        occurredAt: z.coerce.date().optional(),
        channel: channelEnum.optional(),
        direction: directionEnum.optional(),
        notes: z.string().min(1).max(4000).optional(),
        feedback: z.string().max(4000).nullable().optional(),
        nextTalkingPoints: z.string().max(4000).nullable().optional(),
        followUpAt: z.coerce.date().nullable().optional(),
        followUpDoneAt: z.coerce.date().nullable().optional(),
        outcome: outcomeEnum.nullable().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, "At least one field is required");

export async function PATCH(
    req: Request,
    ctx: { params: Promise<{ id: string; stageId: string; eventId: string }> }
) {
    const userId = await requireUserId();
    const { id: applicationId, stageId, eventId } = await ctx.params;

    const stage = await prisma.interviewStage.findFirst({
        where: { id: stageId, applicationId, application: { userId } }, // security-critical
        select: { id: true, application: { select: { status: true } } },
    });
    if (!stage) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (stage.application.status === "REJECTED" || stage.application.status === "GHOSTED") {
        return NextResponse.json({ ok: false, error: "Closed applications cannot modify events." }, { status: 409 });
    }

    const input = patchSchema.parse(await req.json().catch(() => null));

    const exists = await prisma.interviewEvent.findFirst({
        where: { id: eventId, stageId }, // security-critical: event must belong to this stage
        select: { id: true },
    });
    if (!exists) return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });

    const updated = await prisma.$transaction(async (tx) => {
        const ev = await tx.interviewEvent.update({
            where: { id: eventId },
            data: {
                ...(input.occurredAt !== undefined ? { occurredAt: input.occurredAt } : {}),
                ...(input.channel !== undefined ? { channel: input.channel } : {}),
                ...(input.direction !== undefined ? { direction: input.direction } : {}),
                ...(input.notes !== undefined ? { notes: input.notes.trim() } : {}),
                ...(input.feedback !== undefined ? { feedback: input.feedback?.trim() ?? null } : {}),
                ...(input.nextTalkingPoints !== undefined
                    ? { nextTalkingPoints: input.nextTalkingPoints?.trim() ?? null }
                    : {}),
                ...(input.followUpAt !== undefined ? { followUpAt: input.followUpAt } : {}),
                ...(input.followUpDoneAt !== undefined ? { followUpDoneAt: input.followUpDoneAt } : {}),
                ...(input.outcome !== undefined ? { outcome: input.outcome } : {}),
            },
            select: {
                id: true,
                occurredAt: true,
                channel: true,
                direction: true,
                notes: true,
                followUpAt: true,
                followUpDoneAt: true,
                outcome: true,
                updatedAt: true,
            },
        });

        await tx.application.update({
            where: { id: applicationId },
            data: { lastActivityAt: new Date() },
        });

        return ev;
    });

    return NextResponse.json({ ok: true, event: updated });
}

export async function DELETE(
    _req: Request,
    ctx: { params: Promise<{ id: string; stageId: string; eventId: string }> }
) {
    const userId = await requireUserId();
    const { id: applicationId, stageId, eventId } = await ctx.params;

    const stage = await prisma.interviewStage.findFirst({
        where: { id: stageId, applicationId, application: { userId } },
        select: { id: true, application: { select: { status: true } } },
    });
    if (!stage) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (stage.application.status === "REJECTED" || stage.application.status === "GHOSTED") {
        return NextResponse.json({ ok: false, error: "Closed applications cannot delete events." }, { status: 409 });
    }

    const res = await prisma.$transaction(async (tx) => {
        const del = await tx.interviewEvent.deleteMany({
            where: { id: eventId, stageId }, // security-critical
        });
        if (del.count === 0) return null;

        await tx.application.update({
            where: { id: applicationId },
            data: { lastActivityAt: new Date() },
        });

        return del.count;
    });

    if (!res) return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    return NextResponse.json({ ok: true }, { status: 200 });
}
