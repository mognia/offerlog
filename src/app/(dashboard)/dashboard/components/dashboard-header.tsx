import React from "react";
import { CalendarRange } from "lucide-react";

export function DashboardHeader() {
    return (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between animate-in fade-in slide-in-from-top-2 duration-500">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Command Center</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Your job search performance at a glance.
                </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border bg-muted/30 px-4 py-1.5 text-xs font-medium text-muted-foreground">
                <CalendarRange className="h-3.5 w-3.5" />
                <span>Metrics use your local timezone</span>
            </div>
        </div>
    );
}