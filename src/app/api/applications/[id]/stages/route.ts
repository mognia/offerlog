import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {requireUserId} from "@/lib/auth/auth-guard";

const createStageSchema = z.object({
    title: z.string().min(1).max(80),
    orderIndex: z.number().int().min(0).optional(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const userId = await requireUserId();
    const { id: applicationId } = await ctx.params;

    const app = await prisma.application.findFirst({
        where: { id: applicationId, userId }, // security-critical
        select: { id: true },
    });
    if (!app) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const stages = await prisma.interviewStage.findMany({
        where: { applicationId },
        orderBy: [{ orderIndex: "asc" }, { id: "asc" }],
        select: { id: true,stageType: true, title: true, orderIndex: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json({ ok: true, stages });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
    const stageTypeEnum = z.enum([
        "APPLIED",
        "RECRUITER_SCREEN",
        "TECH_SCREEN",
        "CULTURAL",
        "TAKE_HOME",
        "ONSITE",
        "HM_CHAT",
        "OFFER",
        "NEGOTIATION",
        "OTHER",
    ]);

    const createStageSchema = z.object({
        stageType: stageTypeEnum.optional(),
        title: z.string().min(1).max(80),
        orderIndex: z.number().int().min(0).optional(),
    });
    const userId = await requireUserId();
    const { id: applicationId } = await ctx.params;

    const app = await prisma.application.findFirst({
        where: { id: applicationId, userId }, // security-critical
        select: { id: true, status: true },
    });
    if (!app) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const isClosed = app.status === "REJECTED" || app.status === "GHOSTED";
    if (isClosed) {
        return NextResponse.json(
            { ok: false, error: "Closed applications cannot add stages." },
            { status: 409 }
        );
    }

    const input = createStageSchema.parse(await req.json().catch(() => null));
    const now = new Date();

    const created = await prisma.$transaction(async (tx) => {
        const max = await tx.interviewStage.findFirst({
            where: { applicationId },
            orderBy: { orderIndex: "desc" },
            select: { orderIndex: true },
        });
        const insertAt = input.orderIndex ?? (max?.orderIndex ?? -1) + 1;

        if (input.orderIndex !== undefined) {
            await tx.interviewStage.updateMany({
                where: { applicationId, orderIndex: { gte: insertAt } },
                data: { orderIndex: { increment: 1 } }, // logic-critical
            });
        }

        return tx.interviewStage.create({
            data: { applicationId, title: input.title.trim(),stageType: input.stageType ?? null, orderIndex: insertAt, createdAt: now, updatedAt: now },
            select: { id: true, title: true, orderIndex: true, createdAt: true, updatedAt: true },
        });
    });

    return NextResponse.json({ ok: true, stage: created }, { status: 201 });
}
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
    const userId = await requireUserId();
    const { id: applicationId } = await ctx.params;

    // stageId comes from query string: ?stageId=...
    const url = new URL(req.url);
    const stageId = z.string().min(1).parse(url.searchParams.get("stageId"));

    const app = await prisma.application.findFirst({
        where: { id: applicationId, userId }, // security-critical
        select: { id: true, status: true },
    });
    if (!app) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const isClosed = app.status === "REJECTED" || app.status === "GHOSTED";
    if (isClosed) {
        return NextResponse.json({ ok: false, error: "Closed applications cannot delete stages." }, { status: 409 });
    }

    const now = new Date();

    try {
        const result = await prisma.$transaction(async (tx) => {
            const stage = await tx.interviewStage.findFirst({
                where: { id: stageId, applicationId },
                select: { id: true, orderIndex: true, stageType: true },
            });
            if (!stage) return { kind: "not_found" as const };

            // keep the system stage
            if (stage.stageType === "APPLIED") return { kind: "blocked_applied" as const };

            await tx.interviewStage.delete({
                where: { id: stage.id },
            });

            // close the gap in ordering
            await tx.interviewStage.updateMany({
                where: { applicationId, orderIndex: { gt: stage.orderIndex } },
                data: { orderIndex: { decrement: 1 } },
            });

            await tx.application.update({
                where: { id: applicationId },
                data: { lastActivityAt: now },
                select: { id: true },
            });

            return { kind: "ok" as const };
        });

        if (result.kind === "not_found") {
            return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        }
        if (result.kind === "blocked_applied") {
            return NextResponse.json({ ok: false, error: "APPLIED stage cannot be deleted." }, { status: 409 });
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch {
        return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
    }
}