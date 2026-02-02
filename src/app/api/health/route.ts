import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";

export async function GET() {
    await prisma.user.count()
    return NextResponse.json({ok: true});
}