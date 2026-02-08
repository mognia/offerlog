import React from "react";
import Header from "@/components/app/Header";
import {isSessionValid} from "@/lib/auth/validate-session";
import {redirect} from "next/navigation";

export default async function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const sessionValid = await isSessionValid();

    if (!sessionValid.ok) {
        redirect("/login");
    }
    return (
        <div className="min-h-screen bg-muted/40 text-foreground">
            <Header />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {children}
            </div>
        </div>
    );
}