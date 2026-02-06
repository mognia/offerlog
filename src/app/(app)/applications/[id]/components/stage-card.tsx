import React from "react";
import { EventRowItem } from "./event-row-item";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ChevronUp,
    ChevronDown,
    MoreHorizontal,
    Trash2,
    CalendarClock,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {EventRow, Stage, STAGE_COLORS} from "@/components/app/pipeline/pipeline-types";

interface StageCardProps {
    closed: boolean;
    stage: Stage;
    stageTypeLabel: string | null;
    events: EventRow[];
    isFirst: boolean;
    isLast: boolean;
    loadingStageId: string | null;
    movingStage: boolean;
    deleting: boolean;
    markingDone: boolean;
    onLoad: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onOpenAddEvent: () => void;
    onRequestDeleteStage: () => void;
    onMarkDone: (eventId: string) => void;
    onDeleteEvent: (eventId: string) => void;
    registerEventRef: (eventId: string, el: HTMLDivElement | null) => void;
}

export function StageCard({
                              closed,
                              stage,
                              stageTypeLabel,
                              events,
                              isFirst,
                              isLast,
                              loadingStageId,
                              movingStage,
                              deleting,
                              markingDone,
                              onLoad,
                              onMoveUp,
                              onMoveDown,
                              onOpenAddEvent,
                              onRequestDeleteStage,
                              onMarkDone,
                              onDeleteEvent,
                              registerEventRef,
                          }: StageCardProps) {
    const overdueCount = events.filter((e) => e.isOverdue).length;
    const canDeleteStage = !closed && stage.stageType !== "APPLIED";
    const loadingThisStage = loadingStageId === stage.id;

    const borderColor =
        stage.stageType && STAGE_COLORS[stage.stageType]
            ? STAGE_COLORS[stage.stageType]
            : STAGE_COLORS.DEFAULT;

    return (
        <Card
            className={cn(
                "group rounded-xl border-l-4 shadow-sm transition-all hover:shadow-md",
                borderColor
            )}
        >
            <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <div className="text-base font-bold text-foreground flex items-center gap-2">
                <span className="text-muted-foreground/40 text-sm font-mono">
                  #{stage.orderIndex}
                </span>
                                {stage.title}
                            </div>

                            {stageTypeLabel ? (
                                <Badge
                                    variant="secondary"
                                    className="rounded-md text-[10px] uppercase tracking-wider font-semibold opacity-80"
                                >
                                    {stageTypeLabel}
                                </Badge>
                            ) : null}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                  {events.length} events
              </span>
                            {overdueCount > 0 && (
                                <span className="flex items-center gap-1 text-destructive font-medium">
                  <AlertCircle className="h-3 w-3" />
                                    {overdueCount} overdue
                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <div className="flex flex-col gap-0.5 mr-2">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 rounded-md hover:bg-secondary"
                                disabled={closed || movingStage || isFirst}
                                onClick={onMoveUp}
                            >
                                <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 rounded-md hover:bg-secondary"
                                disabled={closed || movingStage || isLast}
                                onClick={onMoveDown}
                            >
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </div>

                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-xs"
                            disabled={closed}
                            onClick={onOpenAddEvent}
                        >
                            + Log Activity
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-lg"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    disabled={!canDeleteStage}
                                    onSelect={onRequestDeleteStage}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Stage
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="mt-6">
                    {!events.length && !loadingThisStage && (
                        <div className="flex flex-col items-center justify-center py-6 text-center rounded-lg border border-dashed bg-muted/20">
                            <p className="text-xs text-muted-foreground mb-2">
                                No activity recorded yet.
                            </p>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onLoad}
                                className="text-xs h-7"
                            >
                                Load History
                            </Button>
                        </div>
                    )}

                    {loadingThisStage && (
                        <div className="space-y-3 pl-4 border-l-2 border-muted">
                            <Skeleton className="h-10 w-3/4" />
                            <Skeleton className="h-10 w-1/2" />
                        </div>
                    )}

                    <div className="relative space-y-0">
                        {events.length > 0 && (
                            <div className="absolute left-[19px] top-2 bottom-4 w-px bg-border" />
                        )}

                        {events.map((e) => (
                            <EventRowItem
                                key={e.id}
                                e={e}
                                closed={closed}
                                deleting={deleting}
                                markingDone={markingDone}
                                onMarkDone={() => onMarkDone(e.id)}
                                onDelete={() => onDeleteEvent(e.id)}
                                registerRef={(el) => registerEventRef(e.id, el)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}