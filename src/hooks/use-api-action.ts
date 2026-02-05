"use client";

import * as React from "react";
import { toastApiError } from "@/lib/toast-error";

type RunOptions<T> = {
    onSuccess?: (data: T) => void;
    onFinally?: () => void;
    successToast?: string;
};

export function useApiAction<T>() {
    const [loading, setLoading] = React.useState(false);

    const run = React.useCallback(
        async (fn: () => Promise<T>, opts?: RunOptions<T>) => {
            setLoading(true);
            try {
                const data = await fn();
                // if (opts?.successToast) {
                //     // keep success toasts rare, but sometimes useful (like "Saved")
                //     // import toast only here if you want, or keep it out entirely
                // }
                opts?.onSuccess?.(data);
                return data;
            } catch (err) {
                toastApiError(err);
                return null;
            } finally {
                setLoading(false);
                opts?.onFinally?.();
            }
        },
        [],
    );

    return { run, loading };
}
