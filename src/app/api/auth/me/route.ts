import {NextResponse} from "next/server";
import {AuthError, requireUserId} from "@/lib/auth-guard";
import {prisma} from "@/lib/prisma";

export async function GET() {
    try {
        const userId = await requireUserId();

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, emailVerifiedAt: true },
        });

        if (!user) {
            return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
        }

        return NextResponse.json({ ok: true, user });
    } catch (e) {
        if (e instanceof AuthError) {
            return NextResponse.json({ ok: false, error: e.code }, { status: e.status });
        }
        throw e;
    }
}