import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";
import {generateToken, hashToken} from "@/lib/crypto";
import {env} from "@/lib/env";
import {Resend} from "resend";

const Body = z.object({
    email: z.email().max(320)
})

const COOLDOWN_SECONDS = 120;

export async function POST(req: Request) {
    const input = Body.parse(await req.json());
    const email = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerifiedAt) {
        return NextResponse.json({ ok: true });
    }
    const last = await prisma.emailVerificationToken.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
    });

    if (last) {
        const secondsSince =
            (Date.now() - last.createdAt.getTime()) / 1000;
        if (secondsSince < COOLDOWN_SECONDS) {
            return NextResponse.json(
                { ok: false, error: "TOO_MANY_REQUESTS" },
                { status: 429 },
            );
        }
    }

    const rawToken = generateToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.emailVerificationToken.create({
        data: {
            userId: user.id,
            tokenHash,
            sentToEmail: email,
            expiresAt,
        },
    });

    const verifyUrl = `${env.APP_BASE_URL}/api/auth/verify-email?token=${rawToken}`;

    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
        from: env.RESEND_FROM,
        to: email,
        subject: "Verify your email for OfferLog",
        html: `<p>Verify your email:</p><p><a href="${verifyUrl}">Verify email</a></p>`,
    });

    return NextResponse.json({ ok: true });
}