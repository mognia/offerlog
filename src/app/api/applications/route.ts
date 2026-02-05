import {z} from "zod";
import {requireUserId} from "@/lib/auth/auth-guard";
import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";

const createApplicationSchema = z.object({
    companyName: z.string().min(1).max(120),
    role: z.string().min(1).max(120),
    jobUrl: z.url().optional().or(z.literal("")),
    location: z.string().max(120).optional().or(z.literal("")),
    source: z.string().max(120).optional().or(z.literal("")),
    notes: z.string().max(400).optional().or(z.literal("")),
    status: z.enum(["OPEN", "HIRED", "REJECTED", "GHOSTED"]).optional(),
})

export async function POST(req: Request) {
    const userId = await requireUserId();
    const json = await req.json().catch(() => null);
    const input = createApplicationSchema.parse(json);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
        const application = await tx.application.create({
            data: {
                companyName: input.companyName.trim(),
                roleTitle: input.role.trim(),
                jobUrl: input.jobUrl?.trim() || null,
                location: input.location?.trim() || null,
                source: input.source?.trim() || null,
                notes: input.notes?.trim() || null,
                status: input.status ?? "OPEN",
                appliedAt: now,
                lastActivityAt: now,
                userId,
            },
            select: { id: true, companyName: true, roleTitle: true, status: true, createdAt: true },
        });

        await tx.interviewStage.create({
            data: {
                applicationId: application.id,
                stageType: "APPLIED", // logic-critical
                title: "Applied",
                orderIndex: 0,
            },
        });

        return application;
    });

    return NextResponse.json({ok: true, application: result}, {status: 201});

}
export async function GET(req: Request) {
    const userId = await requireUserId(); // security-critical: user scope

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const qRaw = url.searchParams.get("q")?.trim();
    const q = qRaw && qRaw.length > 0 ? qRaw.slice(0, 80) : null;

    const where: any = { userId };
    if (status && ["OPEN", "HIRED", "REJECTED", "GHOSTED"].includes(status)) {
        where.status = status;
    }
    if (q) {
        where.OR = [
            { companyName: { contains: q, mode: "insensitive" } },
            { roleTitle: { contains: q, mode: "insensitive" } },
        ];
    }

    const limitRaw = url.searchParams.get("limit");
    const cursor = url.searchParams.get("cursor");

    const limit = Math.min(
        Math.max(Number(limitRaw ?? 20) || 20, 1),
        50
    );

    const rows = await prisma.application.findMany({
        where, // security-critical: must include userId
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: limit + 1, // logic-critical: fetch one extra to detect next page
        ...(cursor
            ? { cursor: { id: cursor }, skip: 1 } // logic-critical: avoid repeating cursor row
            : {}),
        select: {
            id: true,
            companyName: true,
            roleTitle: true,
            status: true,
            updatedAt: true,
            lastActivityAt: true,
            appliedAt: true,
        },
    });

    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;
    const nextCursor = hasNextPage ? items[items.length - 1]!.id : null;

    return NextResponse.json({
        ok: true,
        applications: items,
        page: { limit, nextCursor, hasNextPage },
    });
}
