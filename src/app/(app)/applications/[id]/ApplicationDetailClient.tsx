"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PipelineTabClient from "./PipelineTabClient";

export default function ApplicationDetailClient({ application }: { application: any }) {
    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold">{application.companyName} , {application.roleTitle}</h1>
                    <div className="text-sm text-muted-foreground">
                        Updated: {new Date(application.updatedAt).toLocaleString()}
                    </div>
                </div>
                <Badge>{application.status}</Badge>
            </div>

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-2">
                    <div className="text-sm"><b>URL:</b> {application.jobUrl || "-"}</div>
                    <div className="text-sm"><b>Location:</b> {application.location || "-"}</div>
                    <div className="text-sm"><b>Source:</b> {application.source || "-"}</div>
                    <div className="text-sm whitespace-pre-wrap"><b>Notes:</b>{"\n"}{application.notes || "-"}</div>
                </TabsContent>

                <TabsContent value="pipeline">
                    <PipelineTabClient applicationId={application.id} appStatus={application.status} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
