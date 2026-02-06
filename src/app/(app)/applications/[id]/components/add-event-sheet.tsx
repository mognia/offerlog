import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/app/datetime-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { MessageSquare, CalendarClock } from "lucide-react";
import {Channel, Direction, Outcome} from "@/components/app/pipeline/pipeline-types";
import {cn} from "@/lib/utils";

interface AddEventSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    closed: boolean;
    addingEvent: boolean;
    evOccurredAt: Date | null;
    setEvOccurredAt: (v: Date | null) => void;
    evFollowUpAt: Date | null;
    setEvFollowUpAt: (v: Date | null) => void;
    evChannel: Channel;
    setEvChannel: (v: Channel) => void;
    evDirection: Direction;
    setEvDirection: (v: Direction) => void;
    evOutcome: Outcome | "";
    setEvOutcome: (v: Outcome | "") => void;
    evNotes: string;
    setEvNotes: (v: string) => void;
    onCancel: () => void;
    onSave: () => void;
}

export function AddEventSheet({
                                  open,
                                  onOpenChange,
                                  closed,
                                  addingEvent,
                                  evOccurredAt,
                                  setEvOccurredAt,
                                  evFollowUpAt,
                                  setEvFollowUpAt,
                                  evChannel,
                                  setEvChannel,
                                  evDirection,
                                  setEvDirection,
                                  evOutcome,
                                  setEvOutcome,
                                  evNotes,
                                  setEvNotes,
                                  onCancel,
                                  onSave,
                              }: AddEventSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex h-full w-full flex-col p-0 sm:max-w-lg border-l shadow-2xl">
                <SheetHeader className="border-b bg-muted/30 p-6">
                    <SheetTitle className="text-xl flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Log Activity
                    </SheetTitle>
                    <SheetDescription>
                        Record interactions and set reminders for next steps.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-8">
                        {closed ? (
                            <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                                <span className="font-semibold">Locked:</span> This application
                                is closed.
                            </div>
                        ) : null}

                        <section className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                Details
                            </h4>

                            <div className="grid gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="occurred-at">When did this happen?</Label>
                                    <DateTimePicker
                                        value={evOccurredAt}
                                        onChange={setEvOccurredAt}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Channel</Label>
                                        <Select
                                            value={evChannel}
                                            onValueChange={(v) => setEvChannel(v as Channel)}
                                        >
                                            <SelectTrigger className={cn("rounded-xl", !evChannel && "border-red-200")} >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EMAIL">Email</SelectItem>
                                                <SelectItem value="CALL">Phone / Call</SelectItem>
                                                <SelectItem value="VIDEO">Video Call</SelectItem>
                                                <SelectItem value="ONSITE">On-site</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Direction</Label>
                                        <Select
                                            value={evDirection}
                                            onValueChange={(v) => setEvDirection(v as Direction)}
                                        >
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="OUTBOUND">Outbound ↗️</SelectItem>
                                                <SelectItem value="INBOUND">Inbound ↙️</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                        Outcome
                                    </Label>
                                    <Select
                                        value={evOutcome}
                                        onValueChange={(v) => setEvOutcome(v as Outcome)}
                                    >
                                        <SelectTrigger className={cn("rounded-xl", !evOutcome && "border-red-200")}>
                                            <SelectValue placeholder="Select an outcome..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PASS">Pass / Moving Forward</SelectItem>
                                            <SelectItem value="FAIL">Fail / Rejected</SelectItem>
                                            <SelectItem value="PENDING">Pending / Decision Awaited</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                Content
                            </h4>
                            <Textarea
                                value={evNotes}
                                onChange={(e) => setEvNotes(e.target.value)}
                                placeholder="Paste emails, interview feedback, or quick notes here..."
                                className="min-h-[120px] rounded-xl resize-none text-base"
                            />
                        </section>

                        <section className="space-y-4 rounded-xl border border-dashed p-4 bg-muted/10">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <CalendarClock className="h-4 w-4" /> Follow-up
                            </h4>
                            <div className="space-y-2">
                                <Label>Reminder Date</Label>
                                <DateTimePicker
                                    value={evFollowUpAt}
                                    onChange={setEvFollowUpAt}
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    If set, this will appear in your Overdue alerts if not marked
                                    done.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="border-t bg-background p-4 sm:flex sm:justify-end sm:gap-3">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        disabled={addingEvent}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={closed || addingEvent || !evNotes.trim() || !evOutcome || !evChannel}
                        className="rounded-xl px-8"
                    >
                        {addingEvent ? "Saving..." : "Save Event"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}