export function percentile(sorted: number[], p: number) {
    if (sorted.length === 0) return null;
    const idx = (sorted.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo]!;
    const w = idx - lo;
    return sorted[lo]! * (1 - w) + sorted[hi]! * w;
}

export function median(sorted: number[]) {
    return percentile(sorted, 0.5);
}

export function p75(sorted: number[]) {
    return percentile(sorted, 0.75);
}

export function toHours(ms: number) {
    return ms / (1000 * 60 * 60);
}
