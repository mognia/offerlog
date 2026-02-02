import crypto from "crypto";
import { env } from "@/lib/env";
export function generateToken (bytes: number =32) {
    return crypto.randomBytes(bytes).toString("hex")
}

export function hashToken(rawToken: string) {
    const h = crypto.createHash("sha256");
    h.update(rawToken , 'utf8');
    h.update(env.AUTH_TOKEN_PEPPER,"utf8")
    return h.digest("hex"); // 64 hex chars
}

export function timingSafeEqualHex(a: string, b:string) {
    // This function compares two hex strings in a way that prevents Timing Attacks.
    if (a.length !== b.length) return false;

    const ab = Buffer.from(a,"hex")
    const bb = Buffer.from(b,"hex")
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
}