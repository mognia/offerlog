import { Filter, RefreshCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface DashboardFiltersProps {
    fromLocal: string;
    setFromLocal: (v: string) => void;
    toLocal: string;
    setToLocal: (v: string) => void;
    status: string;
    setStatus: (v: string) => void;
    workMode: string;
    setWorkMode: (v: string) => void;
    sourceBucket: string;
    setSourceBucket: (v: string) => void;
    sourceDraft: string;
    setSourceDraft: (v: string) => void;
    onRefresh: () => void;
}

export function DashboardFilters({
                                     fromLocal,
                                     setFromLocal,
                                     toLocal,
                                     setToLocal,
                                     status,
                                     setStatus,
                                     workMode,
                                     setWorkMode,
                                     sourceBucket,
                                     setSourceBucket,
                                     sourceDraft,
                                     setSourceDraft,
                                     onRefresh,
                                 }: DashboardFiltersProps) {
    return (
        <Card className="rounded-2xl border bg-card/50 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Cohort Filters</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Date Range */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">From</label>
                    <Input
                        type="date"
                        value={fromLocal}
                        onChange={(e) => setFromLocal(e.target.value)}
                        className="rounded-xl bg-background"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">To</label>
                    <Input
                        type="date"
                        value={toLocal}
                        onChange={(e) => setToLocal(e.target.value)}
                        className="rounded-xl bg-background"
                    />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="rounded-xl bg-background">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="OPEN">Open</SelectItem>
                            <SelectItem value="HIRED">Hired</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="GHOSTED">Ghosted</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Work Mode */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Work Mode</label>
                    <Select value={workMode} onValueChange={setWorkMode}>
                        <SelectTrigger className="rounded-xl bg-background">
                            <SelectValue placeholder="All Modes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Modes</SelectItem>
                            <SelectItem value="REMOTE">Remote</SelectItem>
                            <SelectItem value="ONSITE">On-site</SelectItem>
                            <SelectItem value="HYBRID">Hybrid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Source Search */}
                <div className="space-y-1.5 lg:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Source Keyword</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search sources (e.g. LinkedIn, Referral)..."
                            value={sourceDraft}
                            onChange={(e) => setSourceDraft(e.target.value)}
                            className="pl-9 rounded-xl bg-background"
                        />
                    </div>
                </div>

                {/* Refresh Action */}
                <div className="flex items-end lg:col-span-2 lg:justify-end">
                    <Button variant="outline" onClick={onRefresh} className="w-full lg:w-auto rounded-xl gap-2">
                        <RefreshCcw className="h-4 w-4" />
                        Refresh Data
                    </Button>
                </div>
            </div>
        </Card>
    );
}