import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {StageType} from "@/components/app/pipeline/pipeline-types";

interface PipelineHeaderProps {
    closed: boolean;
    newStageTitle: string;
    setNewStageTitle: (v: string) => void;
    newStageType: StageType;
    setNewStageType: (v: StageType) => void;
    addingStage: boolean;
    onAddStage: () => void;
    totalStages: number;
}

export function PipelineHeader({
                                   closed,
                                   newStageTitle,
                                   setNewStageTitle,
                                   newStageType,
                                   setNewStageType,
                                   addingStage,
                                   onAddStage,
                                   totalStages,
                               }: PipelineHeaderProps) {
    return (
        <Card className="rounded-2xl border bg-card shadow-sm p-4 sm:p-5 mb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold tracking-tight">Timeline</h2>
                        <Badge variant="outline" className="rounded-md font-mono text-xs">
                            {totalStages} Stages
                        </Badge>
                        {closed && (
                            <Badge variant="destructive" className="rounded-md">
                                Locked
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your interview process and activity log.
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="grid grid-cols-[1fr_130px_auto] gap-2 w-full md:w-[500px]">
                        <Input
                            value={newStageTitle}
                            onChange={(e) => setNewStageTitle(e.target.value)}
                            placeholder="New stage name..."
                            disabled={closed}
                            className="h-9 rounded-lg bg-background"
                        />

                        <Select
                            value={newStageType}
                            onValueChange={(v) => setNewStageType(v as StageType)}
                            disabled={closed}
                        >
                            <SelectTrigger className="h-9 rounded-lg bg-background">
                                <SelectValue placeholder="Type" />
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

                        <Button
                            onClick={onAddStage}
                            disabled={closed || addingStage || !newStageTitle.trim()}
                            className="h-9 rounded-lg px-4"
                            size="sm"
                        >
                            {addingStage ? "..." : "Add"}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}