export type SourceBucket =
    | "LINKEDIN"
    | "REFERRAL"
    | "RECRUITER"
    | "COMPANY_SITE"
    | "JOB_BOARD"
    | "OTHER";

export function deriveSourceBucket(sourceRaw: string | null | undefined): SourceBucket {
    const s = (sourceRaw ?? "").trim().toLowerCase();
    if (!s) return "OTHER";

    // LINKEDIN
    if (s.includes("linkedin") || s === "li") return "LINKEDIN";

    // REFERRAL
    if (s.includes("referral") || s.includes("referred") || s.includes("friend")) return "REFERRAL";

    // RECRUITER
    if (
        s.includes("recruiter") ||
        s.includes("headhunter") ||
        s.includes("talent") ||
        s.includes("sourcer")
    ) {
        return "RECRUITER";
    }

    // COMPANY_SITE
    if (
        s.includes("company site") ||
        s.includes("site") ||
        s.includes("careers") ||
        s.includes("career page") ||
        s.includes("jobs.") ||
        s.includes("/careers") ||
        s.includes("greenhouse") ||
        s.includes("lever")
    ) {
        return "COMPANY_SITE";
    }

    // JOB_BOARD
    if (
        s.includes("indeed") ||
        s.includes("glassdoor") ||
        s.includes("wellfound") ||
        s.includes("angel") ||
        s.includes("xing") ||
        s.includes("monster") ||
        s.includes("ziprecruiter") ||
        s.includes("levels.fyi") ||
        s.includes("remoteok") ||
        s.includes("weworkremotely") ||
        s.includes("job board") ||
        s.includes("board")
    ) {
        return "JOB_BOARD";
    }

    return "OTHER";
}
