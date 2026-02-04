import {getUserIdFromSessionCookie} from "@/lib/session";

export class AuthError extends Error {
    status: number;
    code: string;
    constructor(status: number, code: string) {
        super(code);
        this.status = status;
        this.code = code;
    }
}

export async function requireUserId() {
    const userId = await getUserIdFromSessionCookie();
    if (!userId) throw new AuthError(401, "UNAUTHENTICATED");
    return userId;
}