
import {getUserIdFromSessionCookie} from "@/lib/session"; // adjust to your prisma client path

export type MeOk = { ok: true };
export type MeFail = { ok: false};

export async function isSessionValid(): Promise<MeOk | MeFail> {
    try {
        const session = await getUserIdFromSessionCookie()
        if (!session) return { ok: false };
        return { ok: true };
    } catch {
        return { ok: false};
    }
}
