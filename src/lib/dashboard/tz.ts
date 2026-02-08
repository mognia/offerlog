const DAY_MS = 24 * 60 * 60 * 1000;

export function getClientDayBoundsUtc(now: Date, tzOffsetMinutes: number) {
    // tzOffsetMinutes is what Date().getTimezoneOffset() returns on the client
    // Example: Istanbul (UTC+3) => -180
    const offsetMs = tzOffsetMinutes * 60 * 1000;

    const localMs = now.getTime() - offsetMs; // convert UTC -> "client local" ms
    const local = new Date(localMs);

    const startLocal = new Date(local);
    startLocal.setHours(0, 0, 0, 0);

    const endLocal = new Date(startLocal.getTime() + DAY_MS); // exclusive

    // convert "local" boundaries back to UTC
    const startUtc = new Date(startLocal.getTime() + offsetMs);
    const endUtc = new Date(endLocal.getTime() + offsetMs);

    return { startUtc, endUtc };
}

export function addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * DAY_MS);
}

export function diffDaysCeil(later: Date, earlier: Date) {
    const ms = later.getTime() - earlier.getTime();
    return Math.ceil(ms / DAY_MS);
}

export function diffDaysFloor(later: Date, earlier: Date) {
    const ms = later.getTime() - earlier.getTime();
    return Math.floor(ms / DAY_MS);
}
