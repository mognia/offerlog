"use client";

import { apiFetch } from "@/lib/api-fetch";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiAction } from "@/hooks/use-api-action";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/empty-state";
import { ChevronUp, ChevronDown } from "lucide-react";
import {useEffect, useMemo, useRef, useState} from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/app/datetime-picker";

import { MoreHorizontal, Trash2 } from "lucide-react";

type Status = "OPEN" | "HIRED" | "REJECTED" | "GHOSTED";

type Stage = {
    id: string;
    title: string;
    orderIndex: number;
    stageType?: string | null;
};

type EventRow = {
    id: string;
    occurredAt: string;
    channel: string;
    direction: string;
    notes: string;
    followUpAt?: string | null;
    followUpDoneAt?: string | null;
    isOverdue?: boolean;
};

type StagesRes = { ok: true; stages: Stage[] };
type EventsRes = { ok: true; events: EventRow[] };
type OkRes = { ok: true } | { ok: false; error?: string };
type Channel = "EMAIL" | "CALL" | "CHAT" | "ONSITE" | "VIDEO" | "OTHER";
type Direction = "OUTBOUND" | "INBOUND" | "UNKNOWN";
type Outcome = "PASS" | "FAIL" | "PENDING";
function formatDate(s?: string | null) {
    if (!s) return "";
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

const STAGE_TYPE_LABELS: Record<string, string> = {
    APPLIED: "Applied",
    RECRUITER_SCREEN: "Recruiter screen",
    TECH_SCREEN: "Tech screen",
    CULTURAL: "Cultural",
    TAKE_HOME: "Take-home",
    ONSITE: "Onsite",
    HM_CHAT: "HM chat",
    OFFER: "Offer",
    NEGOTIATION: "Negotiation",
    OTHER: "Other",
};

export default function PipelineTabClient({
                                              applicationId,
                                              appStatus,
                                          }: {
    applicationId: string;
    appStatus: Status;
})
{
    const closed =
        appStatus === "REJECTED" || appStatus === "GHOSTED" || appStatus === "HIRED";

    type StageType =
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

    const [newStageTitle, setNewStageTitle] = useState("");
    const [newStageType, setNewStageType] = useState<StageType>("OTHER");

    const [eventsByStage, setEventsByStage] = useState<Record<string, EventRow[]>>(
        {},
    );
    const [loadingStageId, setLoadingStageId] = useState<string | null>(null);
    const [stagesRefetchKey, setStagesRefetchKey] = useState(0);

    // delete stage UI state
    const [deleteStageId, setDeleteStageId] = useState<string | null>(null);
    const [eventSheet, setEventSheet] = useState<null | { stageId: string }>(null);

    const [evOccurredAt, setEvOccurredAt] = useState<Date | null>(new Date());
    const [evFollowUpAt, setEvFollowUpAt] = useState<Date | null>(null);
    const [evChannel, setEvChannel] = useState<Channel>("EMAIL");
    const [evDirection, setEvDirection] = useState<Direction>("OUTBOUND");
    const [evOutcome, setEvOutcome] = useState<Outcome | "">("");
    const [evNotes, setEvNotes] = useState("");
    const { data: stagesData, loading: loadingStages } = useApiQuery<StagesRes>(
        () => apiFetch(`/api/applications/${applicationId}/stages`),
        [applicationId, stagesRefetchKey],
    );

    const stages = stagesData?.ok ? stagesData.stages : [];

    const stageById = useMemo(() => {
        const map = new Map<string, Stage>();
        for (const s of stages) map.set(s.id, s);
        return map;
    }, [stages]);

    const deleteStage = stageById.get(deleteStageId ?? "") ?? null;
    const canDeleteSelectedStage =
        !!deleteStage &&
        !closed &&
        deleteStage.stageType !== "APPLIED"; // enforce in UI, backend enforces too
    const eventRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Load events for a stage only when needed (and cache)
    const { run: runLoadEvents } = useApiAction<EventsRes>();

    async function ensureEvents(stageId: string) {
        if (eventsByStage[stageId]) return;
        setLoadingStageId(stageId);
        const res = await runLoadEvents(() =>
            apiFetch(`/api/applications/${applicationId}/stages/${stageId}/events`),
        );
        setLoadingStageId(null);
        if (!res?.ok) return;
        setEventsByStage((prev) => ({ ...prev, [stageId]: res.events ?? [] }));
    }
    const overdueItems = useMemo(() => {
        const out: Array<{
            eventId: string;
            stageId: string;
            stageTitle: string;
            occurredAt: string;
            followUpAt?: string | null;
            notes: string;
        }> = [];

        for (const st of stages) {
            const evs = eventsByStage[st.id] ?? [];
            for (const e of evs) {
                if (e.isOverdue) {
                    out.push({
                        eventId: e.id,
                        stageId: st.id,
                        stageTitle: st.title,
                        occurredAt: e.occurredAt,
                        followUpAt: e.followUpAt ?? null,
                        notes: e.notes,
                    });
                }
            }
        }

        // Sort by followUpAt then occurredAt (oldest first = most urgent)
        out.sort((a, b) => {
            const af = a.followUpAt ? new Date(a.followUpAt).getTime() : Infinity;
            const bf = b.followUpAt ? new Date(b.followUpAt).getTime() : Infinity;
            if (af !== bf) return af - bf;
            return new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
        });

        return out;
    }, [stages, eventsByStage]);

    // prefetch first stage events once stages load
    useEffect(() => {
        const first = stages?.[0];
        if (first) ensureEvents(first.id).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stagesData?.ok]);

    const { run: runAddStage, loading: addingStage } = useApiAction<{ ok: true }>();

    async function addStage() {
        const title = newStageTitle.trim();
        if (!title) return;

        const res = await runAddStage(() =>
            apiFetch(`/api/applications/${applicationId}/stages`, {
                method: "POST",
                body: JSON.stringify({ title, stageType: newStageType }),
            }),
        );

        if (!res?.ok) return;
        setNewStageTitle("");
        setNewStageType("OTHER");

        // stages changed, refetch stages list
        setStagesRefetchKey((x) => x + 1);
    }

    const { run: runMarkDone, loading: markingDone } = useApiAction<{ ok: true }>();

    async function markFollowUpDone(stageId: string, eventId: string) {
        const nowIso = new Date().toISOString();
        const res = await runMarkDone(() =>
            apiFetch(`/api/applications/${applicationId}/stages/${stageId}/events/${eventId}`, {
                method: "PATCH",
                body: JSON.stringify({ followUpDoneAt: nowIso }),
            }),
        );
        if (!res?.ok) return;

        // update cached events
        setEventsByStage((prev) => {
            const evs = prev[stageId] ?? [];
            return {
                ...prev,
                [stageId]: evs.map((e) =>
                    e.id === eventId ? { ...e, followUpDoneAt: nowIso, isOverdue: false } : e,
                ),
            };
        });
    }
    const { run: runAddEvent, loading: addingEvent } = useApiAction<{ ok: true; event?: EventRow }>();

    async function submitAddEvent() {
        if (!eventSheet) return;
        if (!evOccurredAt) return;
        if (!evNotes.trim()) return;

        const stageId = eventSheet.stageId;

        const res = await runAddEvent(() =>
            apiFetch(`/api/applications/${applicationId}/stages/${stageId}/events`, {
                method: "POST",
                body: JSON.stringify({
                    occurredAt: evOccurredAt.toISOString(),
                    channel: evChannel,
                    direction: evDirection,
                    notes: evNotes.trim(),
                    followUpAt: evFollowUpAt ? evFollowUpAt.toISOString() : null,
                    outcome: evOutcome ? evOutcome : null,
                }),
            }),
        );

        if (!res?.ok) return;

        // simplest: refresh that stage events to stay consistent with server shape (isOverdue etc.)
        const refreshed = await runLoadEvents(() =>
            apiFetch(`/api/applications/${applicationId}/stages/${stageId}/events`),
        );
        if (refreshed?.ok) {
            setEventsByStage((prev) => ({ ...prev, [stageId]: refreshed.events ?? [] }));
        }

        setEventSheet(null);
    }
    const { run: runDelete, loading: deleting } = useApiAction<{ ok: true }>();

    async function deleteEvent(stageId: string, eventId: string) {
        const res = await runDelete(() =>
            apiFetch(`/api/applications/${applicationId}/stages/${stageId}/events/${eventId}`, {
                method: "DELETE",
            }),
        );
        if (!res?.ok) return;

        setEventsByStage((prev) => {
            const evs = prev[stageId] ?? [];
            return { ...prev, [stageId]: evs.filter((e) => e.id !== eventId) };
        });
    }
    const { run: runMoveStage, loading: movingStage } = useApiAction<{ ok: true; stage: Stage }>();

    async function moveStage(stageId: string, dir: -1 | 1) {
        const idx = stages.findIndex((s) => s.id === stageId);
        if (idx < 0) return;

        const nextIdx = idx + dir;
        if (nextIdx < 0 || nextIdx >= stages.length) return;

        const targetOrderIndex = stages[nextIdx].orderIndex;

        const res = await runMoveStage(() =>
            apiFetch(`/api/applications/${applicationId}/stages/${stageId}`, {
                method: "PATCH",
                body: JSON.stringify({ orderIndex: targetOrderIndex }),
            }),
        );

        if (!res?.ok) return;

        // refetch stages so orderIndex is authoritative from DB
        setStagesRefetchKey((x) => x + 1);
    }
    // DELETE stage action (calls the new route you added: DELETE /stages?stageId=...)
    const { run: runDeleteStage, loading: deletingStage } = useApiAction<OkRes>();

    async function confirmDeleteStage() {
        if (!deleteStageId) return;

        const res = await runDeleteStage(() =>
            apiFetch(
                `/api/applications/${applicationId}/stages?stageId=${encodeURIComponent(deleteStageId)}`,
                { method: "DELETE" },
            ),
        );

        if (!res || (res as any).ok !== true) return;

        // close dialog
        const removedStageId = deleteStageId;
        setDeleteStageId(null);

        // drop cached events for that stage (optional cleanup)
        setEventsByStage((prev) => {
            if (!prev[removedStageId]) return prev;
            const copy = { ...prev };
            delete copy[removedStageId];
            return copy;
        });

        // stages changed, refetch stages list
        setStagesRefetchKey((x) => x + 1);
    }

    if (loadingStages) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-36 w-full rounded-xl" />
                <Skeleton className="h-36 w-full rounded-xl" />
            </div>
        );
    }

    if (!stages || stages.length === 0) {
        return (
            <EmptyState
                title="No stages"
                description="This should not happen because APPLIED is created by default, but here we are."
            />
        );
    }

    return (
        <div className="space-y-4">
            {/* Delete stage confirm dialog */}
            <AlertDialog open={!!deleteStageId} onOpenChange={(v) => !v && setDeleteStageId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete stage?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteStage ? (
                                <>
                                    You are about to delete{"  "}
                                    <span className="font-medium text-foreground">
                    {deleteStage.title}
                  </span> <br/>
                                  <span className='text-red-600'>This will permanently delete the stage and all events inside it</span>                                  </>
                            ) : (
                                <>This stage will be deleted.</>
                            )}
                            {deleteStage?.stageType === "APPLIED" ? (
                                <div className="mt-2 text-sm text-destructive">
                                    APPLIED cannot be deleted.
                                </div>
                            ) : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className='cursor-pointer' disabled={deletingStage}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className='bg-red-700 cursor-pointer'
                            disabled={!canDeleteSelectedStage || deletingStage}
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDeleteStage().catch(() => {});
                            }}
                        >
                            {deletingStage ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Card className="rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <div className="text-sm font-semibold">Pipeline</div>
                        <div className="text-xs text-muted-foreground">
                            Track events, follow-ups, and stage progression.
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {closed ? (
                            <Badge variant="destructive" className="rounded-full">
                                Closed, locked
                            </Badge>
                        ) : null}
                    </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_220px_140px]">
                    <Input
                        value={newStageTitle}
                        onChange={(e) => setNewStageTitle(e.target.value)}
                        placeholder="Stage title, for example, Recruiter screen"
                        disabled={closed}
                    />

                    <Select
                        value={newStageType}
                        onValueChange={(v) => setNewStageType(v as StageType)}
                        disabled={closed}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Stage type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="RECRUITER_SCREEN">Recruiter screen</SelectItem>
                            <SelectItem value="TECH_SCREEN">Tech screen</SelectItem>
                            <SelectItem value="CULTURAL">Cultural</SelectItem>
                            <SelectItem value="TAKE_HOME">Take-home</SelectItem>
                            <SelectItem value="ONSITE">Onsite</SelectItem>
                            <SelectItem value="HM_CHAT">HM chat</SelectItem>
                            <SelectItem value="OFFER">Offer</SelectItem>
                            <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button onClick={addStage} disabled={closed || addingStage || !newStageTitle.trim()}>
                        {addingStage ? "Adding..." : "Add stage"}
                    </Button>
                </div>
            </Card>
            {overdueItems.length > 0 ? (
                <Card className="rounded-xl border-destructive/30 bg-destructive/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <div className="text-sm font-semibold">Overdue follow-ups</div>
                            <div className="text-xs text-muted-foreground">
                                {overdueItems.length} item(s) need attention.
                            </div>
                        </div>

                        <Badge variant="destructive" className="rounded-full">
                            {overdueItems.length} overdue
                        </Badge>
                    </div>

                    <div className="mt-3 space-y-2">
                        {overdueItems.slice(0, 3).map((it) => (
                            <button
                                key={it.eventId}
                                type="button"
                                className="w-full rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/40"
                                onClick={async () => {
                                    // make sure stage events are loaded first
                                    await ensureEvents(it.stageId);
                                    const el = eventRefs.current[it.eventId];
                                    if (el) {
                                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                                        // quick “flash” highlight
                                        el.classList.add("ring-2", "ring-destructive/40");
                                        window.setTimeout(() => el.classList.remove("ring-2", "ring-destructive/40"), 900);
                                    }
                                }}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold">{it.stageTitle}</div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            Follow-up: {formatDate(it.followUpAt)} , occurred: {formatDate(it.occurredAt)}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                    {it.notes}
                                </div>
                            </button>
                        ))}

                        {overdueItems.length > 3 ? (
                            <div className="text-xs text-muted-foreground">
                                Showing 3 of {overdueItems.length}. Open stages below for the rest.
                            </div>
                        ) : null}
                    </div>
                </Card>
            ) : null}

            <div className="grid gap-3">
                {stages.map((st) => {
                    const evs = eventsByStage[st.id] ?? [];
                    const overdueCount = evs.filter((e) => e.isOverdue).length;
                    const canDeleteStage = !closed && st.stageType !== "APPLIED";

                    return (
                        <Card key={st.id} className="rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-sm font-semibold">
                                            {st.orderIndex}. {st.title}
                                        </div>

                                        {st.stageType ? (
                                            <Badge variant="secondary" className="rounded-full">
                                                {STAGE_TYPE_LABELS[st.stageType] ?? st.stageType}
                                            </Badge>
                                        ) : null}

                                        {overdueCount > 0 ? (
                                            <Badge variant="destructive" className="rounded-full">
                                                {overdueCount} overdue
                                            </Badge>
                                        ) : null}
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label="Move stage up"
                                                disabled={closed || movingStage || st.id === stages[0]?.id}
                                                onClick={() => moveStage(st.id, -1)}
                                            >
                                                <ChevronUp className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                aria-label="Move stage down"
                                                disabled={closed || movingStage || st.id === stages[stages.length - 1]?.id}
                                                onClick={() => moveStage(st.id, 1)}
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="text-xs text-muted-foreground">
                                        {evs.length ? `${evs.length} event(s)` : "No events yet"}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => ensureEvents(st.id)}
                                        disabled={loadingStageId === st.id}
                                    >
                                        {loadingStageId === st.id
                                            ? "Loading..."
                                            : evs.length
                                                ? "Refresh"
                                                : "Load events"}
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={closed}
                                        onClick={() => {
                                            setEventSheet({ stageId: st.id });
                                            setEvOccurredAt(new Date());
                                            setEvFollowUpAt(null);
                                            setEvChannel("EMAIL");
                                            setEvDirection("OUTBOUND");
                                            setEvOutcome("");
                                            setEvNotes("");
                                            ensureEvents(st.id).catch(() => {});
                                        }}
                                    >
                                        Add event
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="ghost" className="px-2" disabled={closed}>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                disabled={!canDeleteStage}
                                                onSelect={() => setDeleteStageId(st.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete stage
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <div className="mt-3 space-y-2">
                                {evs.map((e) => (
                                    <div key={e.id}  ref={(el) => {
                                        eventRefs.current[e.id] = el;
                                    }} className="rounded-lg border bg-background p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="text-sm">
                                                <span className="font-semibold">{e.channel}</span>{" "}
                                                <span className="text-muted-foreground">
                          , {formatDate(e.occurredAt)}
                        </span>
                                                {e.isOverdue ? (
                                                    <Badge className="ml-2 rounded-full" variant="destructive">
                                                        Overdue
                                                    </Badge>
                                                ) : null}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {e.followUpAt && !e.followUpDoneAt ? (
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => markFollowUpDone(st.id, e.id)}
                                                        disabled={closed || markingDone}
                                                    >
                                                        Mark done
                                                    </Button>
                                                ) : null}

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => deleteEvent(st.id, e.id)}
                                                    disabled={closed || deleting}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="mt-2 whitespace-pre-wrap text-sm">{e.notes}</div>

                                        {e.followUpAt ? (
                                            <div className="mt-2 text-xs text-muted-foreground">
                                                Follow-up: {formatDate(e.followUpAt)}
                                                {e.followUpDoneAt ? ` (done ${formatDate(e.followUpDoneAt)})` : ""}
                                            </div>
                                        ) : null}
                                    </div>
                                ))}

                                {evs.length === 0 ? (
                                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                        No events for this stage yet.
                                    </div>
                                ) : null}
                            </div>
                        </Card>
                    );
                })}
            </div>
            <Sheet open={Boolean(eventSheet)} onOpenChange={(open) => !open && setEventSheet(null)}>
                <SheetContent className="flex flex-col h-full w-full sm:max-w-lg p-0">
                    {/* Header with Background Tint */}
                    <SheetHeader className="p-6 bg-muted/30 border-b">
                        <SheetTitle className="text-xl">Add Event</SheetTitle>
                        <SheetDescription>
                            Record an interaction and schedule follow-ups to keep the momentum going.
                        </SheetDescription>
                    </SheetHeader>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Status Alert (Immediate feedback if locked) */}
                        {closed && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                                <span className="font-semibold">Locked:</span> This application is closed and cannot be edited.
                            </div>
                        )}

                        {/* Section 1: Logistics */}
                        <section className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Logistics</h4>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="occurred-at">When did this happen?</Label>
                                    <DateTimePicker value={evOccurredAt} onChange={setEvOccurredAt} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Channel</Label>
                                        <Select value={evChannel} onValueChange={(v) => setEvChannel(v as Channel)}>
                                            <SelectTrigger className="hover:bg-accent transition-colors">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EMAIL">📧 Email</SelectItem>
                                                <SelectItem value="LINKEDIN">🔗 LinkedIn</SelectItem>
                                                <SelectItem value="PHONE">📞 Phone</SelectItem>
                                                <SelectItem value="VIDEO">📹 Video</SelectItem>
                                                <SelectItem value="ONSITE">🤝 On-site</SelectItem>
                                                <SelectItem value="OTHER">✨ Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Direction</Label>
                                        <Select value={evDirection} onValueChange={(v) => setEvDirection(v as Direction)}>
                                            <SelectTrigger className="hover:bg-accent transition-colors">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="OUTBOUND">↗️ Outbound</SelectItem>
                                                <SelectItem value="INBOUND">↙️ Inbound</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Details */}
                        <section className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content & Notes</h4>
                            <div className="space-y-2">
                                <Label className="flex justify-between">
                                    Notes
                                    <span className="text-[10px] font-normal text-muted-foreground uppercase">Required</span>
                                </Label>
                                <Textarea
                                    value={evNotes}
                                    onChange={(e) => setEvNotes(e.target.value)}
                                    placeholder="Key takeaways, questions asked, or next steps..."
                                    className="min-h-[120px] resize-none focus-visible:ring-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label>Outcome</Label>
                                    <Select value={evOutcome} onValueChange={(v) => setEvOutcome(v as any)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select outcome" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PASS">🟢 Pass</SelectItem>
                                            <SelectItem value="PENDING">⚪ Pending</SelectItem>
                                            <SelectItem value="FAIL">🔴 Fail</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Follow-up Date</Label>
                                    <DateTimePicker value={evFollowUpAt} onChange={setEvFollowUpAt} placeholder="Optional" />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Footer with Blur Effect */}
                    <div className="p-4 border-t bg-background/80 backdrop-blur-md flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={() => setEventSheet(null)}>
                            Cancel
                        </Button>
                        <Button
                            className="px-8 shadow-lg shadow-primary/20"
                            onClick={() => submitAddEvent()}
                            disabled={closed || addingEvent || !evOccurredAt || !evNotes.trim()}
                        >
                            {addingEvent ? (
                                <span className="flex items-center gap-2">
                         Saving...
                    </span>
                            ) : "Save Event"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
