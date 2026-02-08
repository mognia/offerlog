import React from "react";
import Header from "@/components/app/Header";

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted/40 text-foreground">
            <Header />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {children}
            </div>
        </div>
    );
}