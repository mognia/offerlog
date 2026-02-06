import {z} from "zod";
import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {generateToken, hashToken} from "@/lib/crypto";
import {env} from "@/lib/env";
import {Resend} from "resend";

const Body = z.object({
    email: z.email().max(320),
});
export async function POST(req: Request) {
    const input = Body.parse(await req.json());
    const email = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.emailVerifiedAt) {
        // no enumeration + avoid spamming unverified signups
        return NextResponse.json({ ok: true });
    }

    const rawToken = generateToken(32);
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    await prisma.passwordResetToken.create({
        data: {
            userId: user.id,
            tokenHash,
            sentToEmail: email,
            expiresAt,
        },
    });

    const resetUrl = `${env.APP_BASE_URL}/reset-password?token=${rawToken}`;

    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
        from: env.RESEND_FROM,
        to: email,
        subject: "Reset your OfferLog password",
        html: `<p>Reset your password:</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires soon.</p>`,
    });

    return NextResponse.json({ ok: true });
}