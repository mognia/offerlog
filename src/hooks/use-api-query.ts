"use client";

import * as React from "react";
import { toastApiError } from "@/lib/toast-error";

export function useApiQuery<T>(fetcher: () => Promise<T>, deps: React.DependencyList) {
    const [data, setData] = React.useState<T | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let alive = true;
        setLoading(true);

        fetcher()
            .then((res) => {
                if (alive) setData(res);
            })
            .catch((err) => {
                if (alive) toastApiError(err);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });

        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { data, loading };
}
