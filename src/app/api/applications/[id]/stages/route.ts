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
