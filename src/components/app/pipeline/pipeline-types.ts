import { ReactNode } from "react";

export type Status = "OPEN" | "HIRED" | "REJECTED" | "GHOSTED";

export type Stage = {
    id: string;
    title: string;
    orderIndex: number;
    stageType?: string | null;
};

export type EventRow = {
    id: string;
    occurredAt: string;
    channel: string;
    direction: string;
    notes: string;
    followUpAt?: string | null;
    followUpDoneAt?: string | null;
    isOverdue?: boolean;
};

export type Channel =
    | "EMAIL"
    | "CALL"
    | "CHAT"
    | "ONSITE"
    | "VIDEO"
    | "OTHER"

export type Direction = "OUTBOUND" | "INBOUND" | "UNKNOWN";
export type Outcome = "PASS" | "FAIL" | "PENDING";

export type StageType =
    | "APPLIED"
    | "RECRUITER_SCREEN"
    | "TECH_SCREEN"
    | "CULTURAL"
    | "TAKE_HOME"
    | "ONSITE"
    | "HM_CHAT"
    | "OFFER"
    | "NEGOTIATION"
    | "OTHER";

export type StagesRes = { ok: true; stages: Stage[] };
export type EventsRes = { ok: true; events: EventRow[] };
export type OkRes = { ok: true } | { ok: false; error?: string };

export const STAGE_COLORS: Record<string, string> = {
    APPLIED: "border-blue-500",
    RECRUITER_SCREEN: "border-purple-500",
    TECH_SCREEN: "border-indigo-500",
    ONSITE: "border-orange-500",
    OFFER: "border-emerald-500",
    REJECTED: "border-red-500",
    DEFAULT: "border-slate-300 dark:border-slate-700",
};

export const STAGE_TYPE_LABELS: Record<string, string> = {
    APPLIED: "Applied",
    RECRUITER_SCREEN: "Recruiter Screen",
    TECH_SCREEN: "Tech Screen",
    CULTURAL: "Cultural Fit",
    TAKE_HOME: "Take-home Task",
    ONSITE: "Onsite Interview",
    HM_CHAT: "Hiring Manager",
    OFFER: "Offer Extended",
    NEGOTIATION: "Negotiation",
    OTHER: "Other",
};