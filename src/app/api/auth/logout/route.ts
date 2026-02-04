import { NextResponse } from "next/server";
import { revokeSessionFromCookie } from "@/lib/session";

export async function POST() {
    await revokeSessionFromCookie();
    return NextResponse.json({ ok: true });
}
