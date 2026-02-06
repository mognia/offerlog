import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // Standard shadcn utility for merging classes

type Status = "OPEN" | "HIRED" | "REJECTED" | "GHOSTED";

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
    OPEN: {
        label: "Open",
        className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
    },
    HIRED: {
        label: "Hired",
        className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
    },
    REJECTED: {
        label: "Rejected",
        className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
    },
    GHOSTED: {
        label: "Ghosted",
        className: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100",
    },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
    const config = STATUS_CONFIG[status];

    return (
        <Badge
            variant="outline"
            className={cn("rounded-full font-medium shadow-none transition-none", config.className, className)}
        >
            {config.label}
        </Badge>
    );
}