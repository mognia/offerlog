import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {requireUserId} from "@/lib/auth/auth-guard";
import z from "zod";

export async function GET(
    _req: Request,
    ctx: { params: Promise<{ id: string }> }
) {
    const userId = await requireUserId(); // security-critical: user scope
    const { id } = await ctx.params;

    const application = await prisma.application.findFirst({
        where: { id, userId }, // security-critical: blocks cross-user access
        select: {
            id: true,
            companyName: true,
            roleTitle: true,
            jobUrl: true,
            location: true,
            source: true,
            notes: true,
            status: true,
            appliedAt: true,
            lastActivityAt: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!application) {
        return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, application });
}

const patchSchema = z.object({
    companyName: z.string().min(1).max(120).optional(),
    roleTitle: z.string().min(1).max(120).optional(),
    jobUrl: z.url().nullable().optional(),
    location: z.string().max(120).nullable().optional(),
    source: z.string().max(120).nullable().optional(),
    notes: z.string().max(4000).nullable().optional(),
    status: z.enum(["OPEN", "HIRED", "REJECTED", "GHOSTED"]).optional(),
});

export async function PATCH (req:Request, ctx:{params: Promise<{ id: string }>}) {
    const userId = await requireUserId(); // security-critical
    const { id } = await ctx.params;

    const current = await prisma.application.findFirst({
        where: { id, userId },
        select: {id:true, status:true},
    });
    if (!current) {
        return NextResponse.json({ ok: false, error: "Not found" },{status:404});
    }

    const input = patchSchema.parse(await req.json().catch(() => null));
    const isClosed = current.status === "REJECTED" || current.status === "GHOSTED";

    if (isClosed) {
        const onlyNotes =
            Object.keys(input).every((k) => k === "notes") && "notes" in input;
        if (!onlyNotes) {
            return NextResponse.json(
                { ok: false, error: "Closed applications can only update notes." },
                { status: 409 }
            );
        }
    }
    const updated = await prisma.application.update({
        where: { id }, // safe because we already proved ownership above
        data: {
            ...(input.companyName !== undefined ? { companyName: input.companyName.trim() } : {}),
            ...(input.roleTitle !== undefined ? { roleTitle: input.roleTitle.trim() } : {}),
            ...(input.jobUrl !== undefined ? { jobUrl: input.jobUrl } : {}),
            ...(input.location !== undefined ? { location: input.location?.trim() ?? null } : {}),
            ...(input.source !== undefined ? { source: input.source?.trim() ?? null } : {}),
            ...(input.notes !== undefined ? { notes: input.notes?.trim() ?? null } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
            lastActivityAt: new Date(), // logic-critical
        },
        select: {
            id: true,
            companyName: true,
            roleTitle: true,
            status: true,
            lastActivityAt: true,
            updatedAt: true,
        },
    });

    return NextResponse.json({ ok: true, application: updated });

}

export async function DELETE(
    _req: Request,
    ctx: { params: Promise<{ id: string }> }
) {
    const userId = await requireUserId(); // security-critical
    const { id } = await ctx.params;

    const current = await prisma.application.findFirst({
        where: { id, userId }, // security-critical: blocks cross-user delete
        select: { id: true, status: true },
    });

    if (!current) {
        return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    if (current.status !== "OPEN") {
        return NextResponse.json(
            { ok: false, error: "Only OPEN applications can be deleted. Preserve history." },
            { status: 409 }
        );
    }

    await prisma.application.delete({ where: { id } });

    return NextResponse.json({ ok: true }, { status: 200 });
}