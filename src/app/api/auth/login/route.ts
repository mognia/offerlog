import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";
import {verifyPassword} from "@/lib/password";
import {createSession, setSessionCookie} from "@/lib/session";

const Body= z.object({
    email: z.email().max(320),
    password: z.string().min(1).max(200)
})

export async function POST(req: Request) {
    const input = Body.parse(await req.json());
    const email = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user || !user.passwordHash) {
        // don't reveal whether email exists
        return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }
    const okPassword = await verifyPassword(user.passwordHash, input.password);

    if (!okPassword) {
        return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    if (!user.emailVerifiedAt) {
        return NextResponse.json({ ok: false, error: "EMAIL_NOT_VERIFIED" }, { status: 403 });
    }

    const { rawToken, expiresAt } = await createSession(user.id);
    await setSessionCookie(rawToken, expiresAt);

    return NextResponse.json({ ok: true });

}