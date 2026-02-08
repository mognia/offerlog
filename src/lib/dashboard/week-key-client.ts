function pad2(n: number) {
    return String(n).padStart(2, "0");
}

export function weekKeyClientLocal(dateUtc: Date, tzOffsetMinutes: number) {
    const offsetMs = tzOffsetMinutes * 60 * 1000;
    const local = new Date(dateUtc.getTime() - offsetMs);

    // Monday-based week start
    const day = local.getDay(); // 0 Sun ... 6 Sat
    const deltaToMonday = (day + 6) % 7; // Mon=0 ... Sun=6
    const monday = new Date(local);
    monday.setDate(local.getDate() - deltaToMonday);
    monday.setHours(0, 0, 0, 0);

    return `${monday.getFullYear()}-${pad2(monday.getMonth() + 1)}-${pad2(monday.getDate())}`; // YYYY-MM-DD
}
