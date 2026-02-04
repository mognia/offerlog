import {NextResponse} from "next/server";
import {hashToken} from "@/lib/crypto";
import {prisma} from "@/lib/prisma";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const rawToken = url.searchParams.get('token');
    if (!rawToken || rawToken.length < 20) {
        return NextResponse.json({ ok: false , error: 'TOKEN_INVALID' }, {status:400});
    }
    const tokenHash = hashToken(rawToken);

    const token = await prisma.emailVerificationToken.findUnique({
        where : {tokenHash},
        include: {user:true}
    })
if (!token) {
    return NextResponse.json({ ok: false, error: "TOKEN_INVALID" }, { status: 400 });
}
if (token.usedAt) {
    return NextResponse.json({ ok: false, error: "TOKEN_USED" }, { status: 400 });

}
if (token.expiresAt <= new Date()) {
    return NextResponse.json({ ok: false, error: "TOKEN_EXPIRED" }, { status: 400 });

}

    await prisma.$transaction([
        prisma.emailVerificationToken.update({
            where: { tokenHash },
            data: { usedAt: new Date() },
        }),
        prisma.user.update({
            where: { id: token.userId },
            data: { emailVerifiedAt: token.user.emailVerifiedAt ?? new Date() },
        }),
    ]);

    return NextResponse.json({ ok: true });
}