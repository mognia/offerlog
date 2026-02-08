import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, AlertTriangle, CalendarCheck } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state"; // Assuming this exists

interface ActionListsProps {
    loading: boolean;
    data: any;
}

export function ActionLists({ loading, data }: ActionListsProps) {
    const router = useRouter();

    if (loading) return null; // Or skeletons
    if (!data) return null;

    const { lists } = data;
    const allDue = [...lists.overdueFollowups, ...lists.dueTodayFollowups];
    const allRisks = [...lists.staleOpenApps, ...lists.noResponseRiskApps];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Follow-up Panel */}
            <Card className="rounded-2xl border shadow-sm flex flex-col h-[400px]">
                <CardHeader className="border-b bg-muted/30 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CalendarCheck className="h-5 w-5 text-blue-500" />
                            <CardTitle className="text-base font-semibold">Focus Zone</CardTitle>
                        </div>
                        <Badge variant="secondary" className="rounded-full px-3">
                            {allDue.length} Tasks
                        </Badge>
                    </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <CardContent className="p-0">
                        {allDue.length === 0 ? (
                            <div className="p-8">
                                <EmptyState title="All clear!" description="You have no pending follow-ups for today." />
                            </div>
                        ) : (
                            <div className="divide-y">
                                {allDue.map((item: any) => (
                                    <div
                                        key={item.appId + item.followUpAt}
                                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                                        onClick={() => router.push(`/applications/${item.appId}?tab=pipeline`)}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-sm truncate">{item.roleTitle}</h4>
                                                <span className="text-xs text-muted-foreground">• {item.companyName}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                {item.daysOverdue > 0 ? (
                                                    <span className="text-red-500 font-medium">Overdue by {item.daysOverdue}d</span>
                                                ) : (
                                                    <span className="text-blue-500 font-medium">Due Today</span>
                                                )}
                                                <span>• {item.stage}</span>
                                            </p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>
            </Card>

            {/* Risk Panel */}
            <Card className="rounded-2xl border shadow-sm flex flex-col h-[400px]">
                <CardHeader className="border-b bg-muted/30 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            <CardTitle className="text-base font-semibold">At Risk</CardTitle>
                        </div>
                        <Badge variant="outline" className="rounded-full px-3">
                            {allRisks.length} Items
                        </Badge>
                    </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <CardContent className="p-0">
                        {allRisks.length === 0 ? (
                            <div className="p-8">
                                <EmptyState title="Pipeline Healthy" description="No stale applications detected." />
                            </div>
                        ) : (
                            <div className="divide-y">
                                {allRisks.map((item: any) => (
                                    <div
                                        key={item.appId}
                                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                                        onClick={() => router.push(`/applications/${item.appId}`)}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-sm truncate">{item.roleTitle}</h4>
                                                <span className="text-xs text-muted-foreground">• {item.companyName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-orange-50 text-orange-700 border-orange-200">
                                                    {item.daysSinceLastActivity ? `Stale ${item.daysSinceLastActivity}d` : `No Response ${item.daysSinceApplied}d`}
                                                </Badge>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>
            </Card>
        </div>
    );
}