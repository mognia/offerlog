import { deriveSourceBucket, type SourceBucket } from "@/lib/dashboard/source-bucket";
import {ApplicationStatus, WorkMode} from "../../../generated/prisma/enums";
import {prisma} from "@/lib/prisma";

export async function getCohortApplicationIds(args: {
    userId: string;
    from: Date;
    to: Date;
    status?: ApplicationStatus;
    workMode?: WorkMode;
    source?: string;
    sourceBucket?: SourceBucket;
}) {
    const baseWhere = {
        userId: args.userId,
        appliedAt: { gte: args.from, lte: args.to },
        ...(args.status ? { status: args.status } : {}),
        ...(args.workMode ? { workMode: args.workMode } : {}),
        ...(args.source
            ? { source: { contains: args.source, mode: "insensitive" as const } }
            : {}),
    };

    const apps = await prisma.application.findMany({
        where: baseWhere,
        select: { id: true, source: true },
    });

    const filtered =
        args.sourceBucket
            ? apps.filter((a) => deriveSourceBucket(a.source) === args.sourceBucket)
            : apps;

    return filtered.map((a) => a.id);
}
