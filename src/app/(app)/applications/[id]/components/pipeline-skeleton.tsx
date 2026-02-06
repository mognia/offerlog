import { Skeleton } from "@/components/ui/skeleton";

export function PipelineSkeleton() {
    return (
        <div className="space-y-4 pt-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <div className="space-y-4">
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
        </div>
    );
}