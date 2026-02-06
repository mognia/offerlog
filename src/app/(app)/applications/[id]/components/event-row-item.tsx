import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Trash2, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import {formatDate, getChannelIcon} from "@/components/app/pipeline/pipeline-utils";
import {EventRow} from "@/components/app/pipeline/pipeline-types";

interface EventRowItemProps {
    e: EventRow;
    closed: boolean;
    deleting: boolean;
    markingDone: boolean;
    onMarkDone: () => void;
    onDelete: () => void;
    registerRef: (el: HTMLDivElement | null) => void;
}

export function EventRowItem({
                                 e,
                                 closed,
                                 deleting,
                                 onMarkDone,
                                 onDelete,
                                 registerRef,
                             }: EventRowItemProps) {
    return (
        <div
            ref={registerRef}
            className="group relative pl-10 py-3 transition-colors hover:bg-muted/30 rounded-r-xl pr-2"
        >
            {/* Timeline Dot */}
            <div
                className={cn(
                    "absolute left-3 top-4 h-4 w-4 rounded-full border-2 bg-background z-10 flex items-center justify-center",
                    e.isOverdue ? "border-red-500" : "border-primary/50"
                )}
            >
                <div
                    className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        e.isOverdue ? "bg-red-500" : "bg-primary"
                    )}
                />
            </div>

            <div className="flex flex-col gap-1">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="secondary"
                            className="h-6 w-6 p-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        >
                            {getChannelIcon(e.channel)}
                        </Badge>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {e.channel} • {e.direction}
            </span>
                        <span className="text-xs text-muted-foreground/60">
              {formatDate(e.occurredAt)}
            </span>
                    </div>

                    {/* Hover Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {e.followUpAt && !e.followUpDoneAt && !closed && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-emerald-600"
                                onClick={onMarkDone}
                                title="Mark Follow-up Done"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                            </Button>
                        )}
                        {!closed && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={onDelete}
                                disabled={deleting}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content Box */}
                <div
                    className={cn(
                        "mt-1 text-sm bg-background border p-3 rounded-lg shadow-sm whitespace-pre-wrap",
                        e.isOverdue
                            ? "border-red-200 bg-red-50/50 dark:bg-red-950/10"
                            : "border-border/60"
                    )}
                >
                    {e.notes}

                    {/* Follow Up Footer inside the bubble */}
                    {e.followUpAt && (
                        <div
                            className={cn(
                                "mt-3 pt-2 border-t flex items-center gap-2 text-xs",
                                e.isOverdue
                                    ? "border-red-200 text-red-600"
                                    : "border-border/50 text-muted-foreground"
                            )}
                        >
                            {e.followUpDoneAt ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            ) : (
                                <CalendarClock className="h-3 w-3" />
                            )}
                            <span>
                Follow-up: {formatDate(e.followUpAt)}
                                {e.followUpDoneAt ? " (Completed)" : ""}
              </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}