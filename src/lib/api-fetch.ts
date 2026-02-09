export class ApiError extends Error {
    status: number;
    details?: unknown;
    constructor(message: string, status: number, details?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

type ApiOk<T> = { ok: true } & T;
type ApiFail = { ok: false; message?: string; error?: string; details?: unknown };

function pickMessage(payload: unknown, fallback: string) {
    if (!payload || typeof payload !== "object") return fallback;
    const p = payload as Partial<ApiFail>;
    return p.message || p.error || fallback;
}

function getBasePath() {
    // Set this in Vercel + local .env:
    // NEXT_PUBLIC_BASE_PATH=/offerlog
    const bp = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    if (!bp) return "";
    return bp.endsWith("/") ? bp.slice(0, -1) : bp;
}

function withBasePath(input: RequestInfo | URL) {
    // Only rewrite string paths like "/api/..."
    if (typeof input !== "string") return input;

    // Only rewrite root-relative paths
    if (!input.startsWith("/")) return input;

    const basePath = getBasePath();
    if (!basePath) return input;

    // Avoid double-prefixing if someone already passed "/offerlog/..."
    if (input === basePath || input.startsWith(basePath + "/")) return input;

    return basePath + input;
}

/**
 * Calls your Next.js API routes, expects JSON, throws ApiError on non-2xx.
 * Always sends cookies (DB-backed sessions) via credentials: "include".
 */
export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<ApiOk<T>> {
    const res = await fetch(withBasePath(input), {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers || {}),
        },
        credentials: "include",
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (!res.ok) {
        const msg = pickMessage(payload, `Request failed (${res.status})`);
        throw new ApiError(msg, res.status, payload);
    }

    return payload as ApiOk<T>;
}
