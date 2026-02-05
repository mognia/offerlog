// src/lib/toast-error.ts
import { toast } from "sonner";
import { ApiError } from "@/lib/api-fetch";

export function toastApiError(err: unknown, fallback = "Something went wrong") {
    if (err instanceof ApiError) {
        toast.error(err.message || fallback);
        return;
    }

    if (err instanceof Error) {
        toast.error(err.message || fallback);
        return;
    }

    toast.error(fallback);
}
