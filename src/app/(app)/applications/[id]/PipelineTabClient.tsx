"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { apiFetch } from "@/lib/api-fetch";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiAction } from "@/hooks/use-api-action";
import { EmptyState } from "@/components/app/empty-state";

import {PipelineSkeleton} from "@/app/(app)/applications/[id]/components/pipeline-skeleton";
import {DeleteStageDialog} from "@/app/(app)/applications/[id]/components/delete-stage-dialog";
import {PipelineHeader} from "@/app/(app)/applications/[id]/components/pipeline-header";
import {OverduePanel} from "@/app/(app)/applications/[id]/components/overdue-panel";
import {StageCard} from "@/app/(app)/applications/[id]/components/stage-card";
import {AddEventSheet} from "@/app/(app)/applications/[id]/components/add-event-sheet";
import {
    Channel,
    Direction,
    EventRow, EventsRes, OkRes,
    Outcome, Stage, STAGE_TYPE_LABELS,
    StagesRes,
    StageType,
    Status
} from "@/components/app/pipeline/pipeline-types";



export default function PipelineTabClient({
                                              applicationId,
                                              appStatus,
                                          }: {
    applicationId: string;
    appStatus: Status;
}) {
    const closed =
        appStatus === "REJECTED" ||
        appStatus === "GHOSTED" ||
        appStatus === "HIRED";

    const [newStageTitle, setNewStageTitle] = useState("");
    const [newStageType, setNewStageType] = useState<StageType>("OTHER");

    const [eventsByStage, setEventsByStage] = useState<
        Record<string, EventRow[]>
    >({});
    const [loadingStageId, setLoadingStageId] = useState<string | null>(null);
    const [stagesRefetchKey, setStagesRefetchKey] = useState(0);

    const [deleteStageId, setDeleteStageId] = useState<string | null>(null);
    const [eventSheet, setEventSheet] = useState<null | { stageId: string }>(
        null
    );

    const [evOccurredAt, setEvOccurredAt] = useState<Date | null>(new Date());
    const [evFollowUpAt, setEvFollowUpAt] = useState<Date | null>(null);
    const [evChannel, setEvChannel] = useState<Channel>("EMAIL");
    const [evDirection, setEvDirection] = useState<Direction>("OUTBOUND");
    const [evOutcome, setEvOutcome] = useState<Outcome | "">("");
    const [evNotes, setEvNotes] = useState("");

    const { data: stagesData, loading: loadingStages } = useApiQuery<StagesRes>(
        () => apiFetch(`/api/applications/${applicationId}/stages`),
        [applicationId, stagesRefetchKey]
    );

    const stages = stagesData?.ok ? stagesData.stages : [];

    const stageById = useMemo(() => {
        const map = new Map<string, Stage>();
        for (const s of stages) map.set(s.id, s);
        return map;
    }, [stages]);

    const deleteStage = stageById.get(deleteStageId ?? "") ?? null;
    const canDeleteSelectedStage =
        !!deleteStage && !closed && deleteStage.stageType !== "APPLIED";

    const eventRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const { run: runLoadEvents } = useApiAction<EventsRes>();

    async function ensureEvents(stageId: string) {
        if (eventsByStage[stageId]) return;
        setLoadingStageId(stageId);
        const res = await runLoadEvents(() =>
            apiFetch(`/api/applications/${applicationId}/stages/${stageId}/events`)
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

        out.sort((a, b) => {
            const af = a.followUpAt ? new Date(a.followUpAt).getTime() : Infinity;
            const bf = b.followUpAt ? new Date(b.followUpAt).getTime() : Infinity;
            if (af !== bf) return af - bf;
            return (
                new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
            );
        });

        return out;
    }, [stages, eventsByStage]);

    useEffect(() => {
        const first = stages?.[0];
        if (first) ensureEvents(first.id).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stagesData?.ok]);

    const { run: runAddStage, loading: addingStage } = useApiAction<{
        ok: true;
    }>();

    async function addStage() {
        const title = newStageTitle.trim();
        if (!title) return;

        const res = await runAddStage(() =>
            apiFetch(`/api/applications/${applicationId}/stages`, {
                method: "POST",
                body: JSON.stringify({ title, stageType: newStageType }),
            })
        );

        if (!res?.ok) return;
        setNewStageTitle("");
        setNewStageType("OTHER");
        setStagesRefetchKey((x) => x + 1);
    }

    const { run: runMarkDone, loading: markingDone } = useApiAction<{
        ok: true;
    }>();

    async function markFollowUpDone(stageId: string, eventId: string) {
        const nowIso = new Date().toISOString();
        const res = await runMarkDone(() =>
            apiFetch(
                `/api/applications/${applicationId}/stages/${stageId}/events/${eventId}`,
                { method: "PATCH", body: JSON.stringify({ followUpDoneAt: nowIso }) }
            )
        );
        if (!res?.ok) return;

        setEventsByStage((prev) => {
            const evs = prev[stageId] ?? [];
            return {
                ...prev,
                [stageId]: evs.map((e) =>
                    e.id === eventId
                        ? { ...e, followUpDoneAt: nowIso, isOverdue: false }
                        : e
                ),
            };
        });
    }

    const { run: runAddEvent, loading: addingEvent } = useApiAction<{
        ok: true;
        event?: EventRow;
    }>();

    async function submitAddEvent() {
        if (!eventSheet) return;
        if (!evOccurredAt) return;
        if (!evNotes.trim()) return;
        if (!evOutcome) return;
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
            })
        );

        if (!res?.ok) return;

        const refreshed = await runLoadEvents(() =>
            apiFetch(`/api/applications/${applicationId}/stages/${stageId}/events`)
        );
        if (refreshed?.ok) {
            setEventsByStage((prev) => ({
                ...prev,
                [stageId]: refreshed.events ?? [],
            }));
        }

        setEventSheet(null);
    }

    const { run: runDelete, loading: deleting } = useApiAction<{ ok: true }>();

    async function deleteEvent(stageId: string, eventId: string) {
        const res = await runDelete(() =>
            apiFetch(
                `/api/applications/${applicationId}/stages/${stageId}/events/${eventId}`,
                { method: "DELETE" }
            )
        );
        if (!res?.ok) return;

        setEventsByStage((prev) => {
            const evs = prev[stageId] ?? [];
            return { ...prev, [stageId]: evs.filter((e) => e.id !== eventId) };
        });
    }

    const { run: runMoveStage, loading: movingStage } = useApiAction<{
        ok: true;
        stage: Stage;
    }>();

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
            })
        );

        if (!res?.ok) return;
        setStagesRefetchKey((x) => x + 1);
    }

    const { run: runDeleteStage, loading: deletingStage } =
        useApiAction<OkRes>();

    async function confirmDeleteStage() {
        if (!deleteStageId) return;

        const res = await runDeleteStage(() =>
            apiFetch(
                `/api/applications/${applicationId}/stages?stageId=${encodeURIComponent(
                    deleteStageId
                )}`,
                { method: "DELETE" }
            )
        );

        if (!res || (res as any).ok !== true) return;

        const removedStageId = deleteStageId;
        setDeleteStageId(null);

        setEventsByStage((prev) => {
            if (!prev[removedStageId]) return prev;
            const copy = { ...prev };
            delete copy[removedStageId];
            return copy;
        });

        setStagesRefetchKey((x) => x + 1);
    }

    async function jumpToOverdue(item: { eventId: string; stageId: string }) {
        await ensureEvents(item.stageId);
        const el = eventRefs.current[item.eventId];
        if (!el) return;

        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-destructive/40");
        window.setTimeout(
            () => el.classList.remove("ring-2", "ring-destructive/40"),
            900
        );
    }

    if (loadingStages) return <PipelineSkeleton />;

    if (!stages || stages.length === 0) {
        return (
            <EmptyState
                title="No stages"
                description="This should not happen because APPLIED is created by default, but here we are."
            />
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <DeleteStageDialog
                open={!!deleteStageId}
                onOpenChange={(v) => !v && setDeleteStageId(null)}
                deleteStage={deleteStage}
                canDeleteSelectedStage={canDeleteSelectedStage}
                deletingStage={deletingStage}
                onConfirm={() => confirmDeleteStage().catch(() => {})}
            />

            <div className="sticky top-0 z-10 -mx-4 px-4 pb-4 pt-2 backdrop-blur-md bg-background/80 supports-[backdrop-filter]:bg-background/60">
                <PipelineHeader
                    closed={closed}
                    newStageTitle={newStageTitle}
                    setNewStageTitle={setNewStageTitle}
                    newStageType={newStageType}
                    setNewStageType={setNewStageType}
                    addingStage={addingStage}
                    onAddStage={() => addStage().catch(() => {})}
                    totalStages={stages.length}
                />

                <OverduePanel
                    items={overdueItems}
                    onJump={(it) => jumpToOverdue(it).catch(() => {})}
                />
            </div>

            <div className="grid gap-6 pb-20">
                {stages.map((st, idx) => {
                    const evs = eventsByStage[st.id] ?? [];
                    return (
                        <StageCard
                            key={st.id}
                            closed={closed}
                            stage={st}
                            stageTypeLabel={
                                st.stageType
                                    ? STAGE_TYPE_LABELS[st.stageType] ?? st.stageType
                                    : null
                            }
                            events={evs}
                            isFirst={idx === 0}
                            isLast={idx === stages.length - 1}
                            loadingStageId={loadingStageId}
                            movingStage={movingStage}
                            deleting={deleting}
                            markingDone={markingDone}
                            onLoad={() => ensureEvents(st.id).catch(() => {})}
                            onMoveUp={() => moveStage(st.id, -1).catch(() => {})}
                            onMoveDown={() => moveStage(st.id, 1).catch(() => {})}
                            onOpenAddEvent={() => {
                                setEventSheet({ stageId: st.id });
                                setEvOccurredAt(new Date());
                                setEvFollowUpAt(null);
                                setEvChannel("EMAIL");
                                setEvDirection("OUTBOUND");
                                setEvOutcome("");
                                setEvNotes("");
                                ensureEvents(st.id).catch(() => {});
                            }}
                            onRequestDeleteStage={() => setDeleteStageId(st.id)}
                            onMarkDone={(eventId) =>
                                markFollowUpDone(st.id, eventId).catch(() => {})
                            }
                            onDeleteEvent={(eventId) =>
                                deleteEvent(st.id, eventId).catch(() => {})
                            }
                            registerEventRef={(eventId, el) => {
                                eventRefs.current[eventId] = el;
                            }}
                        />
                    );
                })}
            </div>

            <AddEventSheet
                open={Boolean(eventSheet)}
                onOpenChange={(open) => !open && setEventSheet(null)}
                closed={closed}
                addingEvent={addingEvent}
                evOccurredAt={evOccurredAt}
                setEvOccurredAt={setEvOccurredAt}
                evFollowUpAt={evFollowUpAt}
                setEvFollowUpAt={setEvFollowUpAt}
                evChannel={evChannel}
                setEvChannel={setEvChannel}
                evDirection={evDirection}
                setEvDirection={setEvDirection}
                evOutcome={evOutcome}
                setEvOutcome={setEvOutcome}
                evNotes={evNotes}
                setEvNotes={setEvNotes}
                onCancel={() => setEventSheet(null)}
                onSave={() => submitAddEvent().catch(() => {})}
            />
        </div>
    );
}