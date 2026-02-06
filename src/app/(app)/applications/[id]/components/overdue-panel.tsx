import { AlertCircle } from "lucide-react";

interface OverdueItem {
    eventId: string;
    stageId: string;
    stageTitle: string;
    occurredAt: string;
    followUpAt?: string | null;
    notes: string;
}

interface OverduePanelProps {
    items: OverdueItem[];
    onJump: (it: { eventId: string; stageId: string }) => void;
}

export function OverduePanel({ items, onJump }: OverduePanelProps) {
    if (!items.length) return null;

    return (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50/90 dark:bg-red-950/20 p-3 shadow-sm backdrop-blur-sm animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-semibold text-red-900 dark:text-red-200">
          Action Required ({items.length})
        </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {items.map((it) => (
                    <button
                        key={it.eventId}
                        type="button"
                        className="flex-shrink-0 w-64 rounded-lg border bg-background/80 p-2.5 text-left shadow-sm hover:shadow-md transition-all hover:bg-background hover:scale-[1.02]"
                        onClick={() => onJump({ eventId: it.eventId, stageId: it.stageId })}
                    >
                        <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-foreground truncate max-w-[70%]">
                {it.stageTitle}
              </span>
                            <span className="text-[10px] text-red-500 font-medium">
                Overdue
              </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 truncate">
                            {it.notes}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}