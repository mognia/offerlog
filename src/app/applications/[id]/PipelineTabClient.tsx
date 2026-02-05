"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {useEffect, useState} from "react";

type Stage = { id: string; title: string; orderIndex: number; stageType?: string | null };
type EventRow = any & { isOverdue?: boolean };

export default function PipelineTabClient({
                                              applicationId,
                                              appStatus,
                                          }: {
    applicationId: string;
    appStatus: "OPEN" | "HIRED" | "REJECTED" | "GHOSTED";
}) {
    const closed = appStatus === "REJECTED" || appStatus === "GHOSTED";
    const [stages, setStages] = useState<Stage[]>([]);
    const [eventsByStage, setEventsByStage] = useState<Record<string, EventRow[]>>({});
    const [newStageTitle, setNewStageTitle] = useState("");
    const [loading, setLoading] = useState(false);

    async function loadAll() {
        setLoading(true);
        const sRes = await fetch(`/api/applications/${applicationId}/stages`, { credentials: "include" });
        const sJson = await sRes.json();
        if (!sJson.ok) throw new Error(sJson.error || "Failed stages");
        const s = (sJson.stages ?? []) as Stage[];
        setStages(s);

        const pairs = await Promise.all(
            s.map(async (st) => {
                const eRes = await fetch(`/api/applications/${applicationId}/stages/${st.id}/events`, {
                    credentials: "include",
                });
                const eJson = await eRes.json();
                return [st.id, (eJson.events ?? []) as EventRow[]] as const;
            })
        );
        const map: Record<string, EventRow[]> = {};
        for (const [sid, evs] of pairs) map[sid] = evs;
        setEventsByStage(map);
        setLoading(false);
    }

    useEffect(() => {
        loadAll().catch(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [applicationId]);

    async function addStage() {
        if (!newStageTitle.trim()) return;
        await fetch(`/api/applications/${applicationId}/stages`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newStageTitle.trim(), stageType: "OTHER" }),
        });
        setNewStageTitle("");
        await loadAll();
    }

    async function addEvent(stageId: string) {
        const occurredAt = new Date().toISOString();
        await fetch(`/api/applications/${applicationId}/stages/${stageId}/events`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                occurredAt,
                channel: "EMAIL",
                direction: "OUTBOUND",
                notes: "Pinged recruiter",
                followUpAt: new Date(Date.now() + 3 * 864e5).toISOString(),
            }),
        });
        await loadAll();
    }

    async function markFollowUpDone(stageId: string, eventId: string) {
        await fetch(`/api/applications/${applicationId}/stages/${stageId}/events/${eventId}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ followUpDoneAt: new Date().toISOString() }),
        });
        await loadAll();
    }

    async function deleteEvent(stageId: string, eventId: string) {
        await fetch(`/api/applications/${applicationId}/stages/${stageId}/events/${eventId}`, {
            method: "DELETE",
            credentials: "include",
        });
        await loadAll();
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Input
                    value={newStageTitle}
                    onChange={(e) => setNewStageTitle(e.target.value)}
                    placeholder="New stage title"
                    disabled={closed}
                />
                <Button onClick={addStage} disabled={closed || loading}>Add Stage</Button>
                {closed && <Badge variant="destructive">Closed, locked</Badge>}
            </div>

            <div className="space-y-3">
                {stages.map((st) => {
                    const evs = eventsByStage[st.id] ?? [];
                    const overdueCount = evs.filter((e) => e.isOverdue).length;

                    return (
                        <div key={st.id} className="rounded-md border p-4 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="font-medium">
                                    {st.orderIndex}. {st.title} {st.stageType ? <span className="text-muted-foreground">({st.stageType})</span> : null}
                                </div>
                                <div className="flex items-center gap-2">
                                    {overdueCount > 0 && <Badge variant="destructive">{overdueCount} overdue</Badge>}
                                    <Button size="sm" variant="outline" onClick={() => addEvent(st.id)} disabled={closed}>
                                        Add Event
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {evs.map((e) => (
                                    <div key={e.id} className="rounded-md bg-muted/40 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="text-sm">
                                                <b>{e.channel}</b> , {new Date(e.occurredAt).toLocaleString()}
                                                {e.isOverdue ? <Badge className="ml-2" variant="destructive">Overdue</Badge> : null}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {e.followUpAt && !e.followUpDoneAt && (
                                                    <Button size="sm" variant="outline" onClick={() => markFollowUpDone(st.id, e.id)} disabled={closed}>
                                                        Mark follow-up done
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="ghost" onClick={() => deleteEvent(st.id, e.id)} disabled={closed}>
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="text-sm whitespace-pre-wrap">{e.notes}</div>
                                        {e.followUpAt && (
                                            <div className="text-xs text-muted-foreground">
                                                Follow-up: {new Date(e.followUpAt).toLocaleString()}
                                                {e.followUpDoneAt ? ` (done ${new Date(e.followUpDoneAt).toLocaleString()})` : ""}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {evs.length === 0 && <div className="text-sm text-muted-foreground">No events yet.</div>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
        </div>
    );
}
