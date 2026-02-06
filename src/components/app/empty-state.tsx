import {ReactNode} from "react";

export function EmptyState({
                               title,
                               description,
                               action,
                           }: {
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="rounded-xl border bg-background p-8">
            <div className="max-w-md space-y-2">
                <h2 className="text-base font-semibold">{title}</h2>
                {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
                {action ? <div className="pt-2">{action}</div> : null}
            </div>
        </div>
    );
}