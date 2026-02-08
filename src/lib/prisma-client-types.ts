
// -------------------- Application --------------------
export const ApplicationStatus = {
    OPEN: "OPEN",
    HIRED: "HIRED",
    REJECTED: "REJECTED",
    GHOSTED: "GHOSTED",
} as const;

export type ApplicationStatus =
    (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

// -------------------- Work mode --------------------
export const WorkMode = {
    ONSITE: "ONSITE",
    HYBRID: "HYBRID",
    REMOTE: "REMOTE",
} as const;

export type WorkMode = (typeof WorkMode)[keyof typeof WorkMode];

// -------------------- Interview --------------------
export const InterviewChannel = {
    EMAIL: "EMAIL",
    CALL: "CALL",
    VIDEO: "VIDEO",
    ONSITE: "ONSITE",
    CHAT: "CHAT",
    OTHER: "OTHER",
} as const;

export type InterviewChannel =
    (typeof InterviewChannel)[keyof typeof InterviewChannel];

// -------------------- Events --------------------
export const EventOutcome = {
    PASS: "PASS",
    FAIL: "FAIL",
    PENDING: "PENDING",
} as const;

export type EventOutcome =
    (typeof EventOutcome)[keyof typeof EventOutcome];

export const MessageDirection = {
    INBOUND: "INBOUND",
    OUTBOUND: "OUTBOUND",
    UNKNOWN: "UNKNOWN",
} as const;

export type MessageDirection =
    (typeof MessageDirection)[keyof typeof MessageDirection];

// -------------------- Stages --------------------
export const StageType = {
    APPLIED: "APPLIED",
    RECRUITER_SCREEN: "RECRUITER_SCREEN",
    TECH_SCREEN: "TECH_SCREEN",
    TAKE_HOME: "TAKE_HOME",
    CULTURAL: "CULTURAL",
    ONSITE: "ONSITE",
    HM_CHAT: "HM_CHAT",
    OFFER: "OFFER",
    NEGOTIATION: "NEGOTIATION",
    OTHER: "OTHER",
} as const;

export type StageType = (typeof StageType)[keyof typeof StageType];
