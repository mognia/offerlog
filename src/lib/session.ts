import {generateToken, hashToken} from "@/lib/crypto";
import {prisma} from "@/lib/prisma";
import {cookies} from "next/headers";
import {env} from "@/lib/env";

const SESSION_TTL_DAYS = 38;


function computeExpiry() {
    const ms = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + ms);
}


export async function createSession(userId: string, meta?: { ip?: string; userAgent?: string }) {
    const rawToken = generateToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = computeExpiry();

    await prisma.session.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
            ip: meta?.ip,
            userAgent: meta?.userAgent,
        },
    });

    return { rawToken, expiresAt };
}

export async function setSessionCookie(rawToken: string, expiresAt: Date) {
    const cookieStore = await cookies()
    cookieStore.set(env.SESSION_COOKIE_NAME, rawToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
    });
}

export async function clearSessionCookie() {
    const cookieStore = await cookies()

    cookieStore.set(env.SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(0),
    });
}
export async function getUserIdFromSessionCookie() {
    const cookieStore = await cookies()

    const raw = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;
    if (!raw) return null;

    const tokenHash = hashToken(raw);
    const s = await prisma.session.findUnique({ where: { tokenHash } });
    if (!s) return null;
    if (s.revokedAt) return null;
    if (s.expiresAt <= new Date()) return null;

    return s.userId;
}

export async function revokeSessionFromCookie() {
    const cookieStore = await cookies()

    const raw = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;
    if (!raw) return;

    const tokenHash = hashToken(raw);
    await prisma.session.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
    });

    clearSessionCookie();
}