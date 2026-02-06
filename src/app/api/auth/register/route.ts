import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";
import {hashPassword} from "@/lib/password";
import {generateToken, hashToken} from "@/lib/crypto";
import {env} from "@/lib/env";
import {Resend} from "resend";

const Body = z.object({
    email: z.string().email().max(320),
    password: z.string().min(8).max(200),
});

export async function POST(req: Request,) {
    const input = Body.parse(await req.json());
    const email = input.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
        where: { email }
    });
    if (existing) {
        return NextResponse.json({ ok: false, error: "EMAIL_IN_USE" }, { status: 409 });
    }
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: await hashPassword(input.password),
        },
    });

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

    const verifyUrl = `${env.APP_BASE_URL}/verify-email?token=${rawToken}`;

    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
        from: env.RESEND_FROM,
        to: email,
        subject: "Verify your email for OfferLog",
        html: `<p>Verify your email:</p><p><a href="${verifyUrl}">Verify email</a></p><p>If you didn’t request this, ignore it.</p>`,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
}