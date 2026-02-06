import React from "react";
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
import {Stage} from "@/components/app/pipeline/pipeline-types";

interface DeleteStageDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    deleteStage: Stage | null;
    canDeleteSelectedStage: boolean;
    deletingStage: boolean;
    onConfirm: () => void;
}

export function DeleteStageDialog({
                                      open,
                                      onOpenChange,
                                      deleteStage,
                                      canDeleteSelectedStage,
                                      deletingStage,
                                      onConfirm,
                                  }: DeleteStageDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete stage?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {deleteStage ? (
                            <>
                                You are about to delete{" "}
                                <span className="font-medium text-foreground">
                  {deleteStage.title}
                </span>
                                <br />
                                <span className="text-red-600">
                  This will permanently delete the stage and all events inside it
                </span>
                            </>
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
                    <AlertDialogCancel
                        className="cursor-pointer"
                        disabled={deletingStage}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="cursor-pointer bg-red-700 hover:bg-red-800"
                        disabled={!canDeleteSelectedStage || deletingStage}
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                    >
                        {deletingStage ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}