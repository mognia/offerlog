
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

type ApiOk<T> = {ok:true} & T;
type ApiFail = { ok: false; message?: string; error?: string; details?: unknown };

function pickMessage(payload: unknown, fallback: string){
    // If the API returned nothing or just a plain string/number, it gives up and returns the backup.
    if (!payload || typeof payload !== "object") return fallback;
    // This tells TypeScript: "Treat this object as if it might follow the ApiFail structure."
    const p = payload as Partial<ApiFail>;
    return p.message || p.error || fallback;
}
/**
 * Calls your Next.js API routes, expects JSON, throws ApiError on non-2xx.
 * Always sends cookies (DB-backed sessions) via credentials: "include".
 */
export async function apiFetch<T>(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<ApiOk<T>> {
    const res = await fetch(input, {
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