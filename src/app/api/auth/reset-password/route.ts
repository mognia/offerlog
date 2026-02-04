import {z} from "zod";
import {hashToken} from "@/lib/crypto";
import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";
import {clearSessionCookie} from "@/lib/session";

const Body = z.object({
    token: z.string().min(20),
    newPassword: z.string().min(8).max(200),
});

export async function POST(req:Request,) {
    const input = Body.parse(await req.json());
    const tokenHash = hashToken(input.token);

    const token = await prisma.passwordResetToken.findUnique({
        where : {tokenHash}
    });

    if (!token) {
        return NextResponse.json({ ok: false, error: "TOKEN_INVALID" }, { status: 400 });
    }
    if (token.usedAt) {
        return NextResponse.json({ ok: false, error: "TOKEN_USED" }, { status: 400 });
    }
    if (token.expiresAt <= new Date()) {
        return NextResponse.json({ ok: false, error: "TOKEN_EXPIRED" }, { status: 400 });
    }

    const newHash = hashToken(input.newPassword);

    await prisma.$transaction([
        prisma.passwordResetToken.update({
            where:{tokenHash},
            data : {usedAt: new Date()}
        }),

        prisma.user.update({
            where: {id: token.userId},
            data: {passwordHash: newHash},
        }),
        prisma.session.updateMany({
            where : {userId: token.userId, revokedAt:null},
            data: {revokedAt: new Date()}
        })
    ]);

    await clearSessionCookie();  // force re-login everywhere
    return NextResponse.json({ ok: true });
}