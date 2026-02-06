import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {requireUserId} from "@/lib/auth/auth-guard";

const stageTypeEnum = z.enum([
    "APPLIED",
    "RECRUITER_SCREEN",
    "TECH_SCREEN",
    "TAKE_HOME",
    "CULTURAL",
    "ONSITE",
    "HM_CHAT",
    "OFFER",
    "NEGOTIATION",
    "OTHER",
]);

const patchSchema = z.object({
    title: z.string().min(1).max(80).optional(),
    stageType: stageTypeEnum.nullable().optional(),
    orderIndex: z.number().int().min(0).optional(),
});

export async function PATCH(
    req: Request,
    ctx: { params: Promise<{ id: string; stageId: string }> }
)
{
    const userId = await requireUserId(); // security-critical
    const { id: applicationId, stageId } = await ctx.params;

    const app = await prisma.application.findFirst({
        where: { id: applicationId, userId },
        select: { id: true, status: true },
    });
    if (!app) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    if (app.status === "REJECTED" || app.status === "GHOSTED") {
        return NextResponse.json(
            { ok: false, error: "Closed applications cannot modify stages." },
            { status: 409 }
        );
    }

    const input = patchSchema.parse(await req.json().catch(() => null));

    const current = await prisma.interviewStage.findFirst({
        where: { id: stageId, applicationId },
        select: { id: true, orderIndex: true },
    });
    if (!current) {
        return NextResponse.json({ ok: false, error: "Stage not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
        if (input.orderIndex !== undefined && input.orderIndex !== current.orderIndex) {
            const target = input.orderIndex;

            if (target > current.orderIndex) {
                await tx.interviewStage.updateMany({
                    where: {
                        applicationId,
                        orderIndex: { gt: current.orderIndex, lte: target },
                    },
                    data: { orderIndex: { decrement: 1 } },
                });
            } else {
                await tx.interviewStage.updateMany({
                    where: {
                        applicationId,
                        orderIndex: { gte: target, lt: current.orderIndex },
                    },
                    data: { orderIndex: { increment: 1 } },
                });
            }
        }

        return tx.interviewStage.update({
            where: { id: stageId },
            data: {
                ...(input.title !== undefined ? { title: input.title.trim() } : {}),
                ...(input.stageType !== undefined ? { stageType: input.stageType } : {}),
                ...(input.orderIndex !== undefined ? { orderIndex: input.orderIndex } : {}),
            },
            select: {
                id: true,
                stageType: true,
                title: true,
                orderIndex: true,
                updatedAt: true,
            },
        });
    });

    return NextResponse.json({ ok: true, stage: updated });
}
