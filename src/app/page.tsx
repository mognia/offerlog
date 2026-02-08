import Image from "next/image";
import React from "react";
import {ArrowRight, CheckCircle2, LineChart, ShieldCheck, Target, Zap} from "lucide-react";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {Badge} from "@/components/ui/badge";

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Navigation */}
            <nav className="border-b sticky top-0 bg-background/80 backdrop-blur-md z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                            <Target className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">OfferLog</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button size="sm" className="rounded-full px-5" asChild>
                            <Link href="/dashboard">Open Dashboard</Link>
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="pt-24 pb-16 px-4">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <Badge variant="secondary" className="rounded-full px-4 py-1 text-[10px] uppercase tracking-widest font-bold border-primary/20 bg-primary/5 text-primary">
                            Not a CRUD app. A Career CRM.
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
                            Stop guessing. <br />
                            <span className="text-muted-foreground">Start measuring.</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            OfferLog is a disciplined job-hunting tracker designed to turn your search into a measurable pipeline. No AI hype, no emotional guesswork—just logic.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Button size="lg" className="rounded-xl px-8 h-14 text-base font-bold shadow-lg shadow-primary/20" asChild>
                                <Link href="/dashboard">
                                    Deploy Your Pipeline <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" className="rounded-xl px-8 h-14 text-base font-bold bg-transparent">
                                View Methodology
                            </Button>
                        </div>
                    </div>
                </section>

                {/* The "Dashboard Preview" Placeholder */}
                {/*<section className="px-4 pb-24">*/}
                {/*    <div className="max-w-6xl mx-auto rounded-2xl border bg-card/50 shadow-2xl overflow-hidden aspect-video relative group border-primary/10">*/}
                {/*        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />*/}
                {/*        /!* Mock Dashboard UI UI Elements *!/*/}
                {/*        <div className="p-8 space-y-6 opacity-80 group-hover:opacity-100 transition-opacity">*/}
                {/*            <div className="flex items-center justify-between border-b pb-4">*/}
                {/*                <div className="h-4 w-32 bg-muted rounded animate-pulse" />*/}
                {/*                <div className="flex gap-2">*/}
                {/*                    <div className="h-8 w-8 bg-muted rounded-full" />*/}
                {/*                    <div className="h-8 w-8 bg-muted rounded-full" />*/}
                {/*                </div>*/}
                {/*            </div>*/}
                {/*            <div className="grid grid-cols-4 gap-4">*/}
                {/*                {[1,2,3,4].map(i => (*/}
                {/*                    <div key={i} className="h-24 border rounded-xl bg-background/50 p-4 space-y-2">*/}
                {/*                        <div className="h-2 w-12 bg-muted rounded" />*/}
                {/*                        <div className="h-6 w-16 bg-muted rounded" />*/}
                {/*                    </div>*/}
                {/*                ))}*/}
                {/*            </div>*/}
                {/*            <div className="h-64 border rounded-xl bg-background/50 w-full" />*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</section>*/}

                {/* Feature Grid: Problem/Solution */}
                <section className="bg-muted/30 border-y py-24 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <FeatureItem
                                icon={<LineChart className="text-primary" />}
                                title="Structured Intelligence"
                                description="Automatic calculation of response times and conversion rates. Know which sources actually lead to offers."
                            />
                            <FeatureItem
                                icon={<ShieldCheck className="text-primary" />}
                                title="Anti-Delusion Design"
                                description="Opinionated rules. Closed applications are locked. Once it's a 'Ghost', it stays a 'Ghost'. Data honesty is mandatory."
                            />
                            <FeatureItem
                                icon={<Zap className="text-primary" />}
                                title="Event-Driven Timeline"
                                description="Stop writing text blobs. Track interviews, tech screens, and take-homes as explicit events with outcomes."
                            />
                        </div>
                    </div>
                </section>

                {/* Deep Dive Section */}
                <section className="py-24 px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold tracking-tight">The Problem: Most job trackers are just lists.</h2>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                                        <p className="text-muted-foreground"><span className="text-foreground font-semibold">Ghosted or Impatient?</span> OfferLog flags stale apps so you stop waiting for companies that aren't coming back.</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                                        <p className="text-muted-foreground"><span className="text-foreground font-semibold">Where is the leak?</span> Identify exactly which stage (Screen, Tech, Onsite) your pipeline breaks.</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                                        <p className="text-muted-foreground"><span className="text-foreground font-semibold">ROI by Source.</span> Stop applying on LinkedIn if your referrals are the only thing working. See the math.</p>
                                    </li>
                                </ul>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard label="Response Speed" value="2.4d" trend="Median" />
                                <StatCard label="Hygiene Score" value="98%" trend="On-time" />
                                <StatCard label="Funnel Depth" value="4 Stages" trend="Avg." />
                                <StatCard label="Conversion" value="12%" trend="Lead -> Offer" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 px-4 border-t">
                    <div className="max-w-3xl mx-auto text-center border p-12 rounded-[2rem] bg-primary/5 border-primary/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Target className="h-48 w-48" />
                        </div>
                        <h2 className="text-4xl font-extrabold mb-4">Ready to treat your search like a professional?</h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            No AI job appliers. No resume optimizers. Just feedback loops for disciplined job hunters.
                        </p>
                        <Button size="lg" className="rounded-xl px-12 h-14 text-base font-bold" asChild>
                            <Link href="/dashboard">Create Your Log</Link>
                        </Button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t py-12 px-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-muted-foreground" />
                        <span className="font-bold tracking-tight text-muted-foreground">OfferLog</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Built for those who prefer clarity over chaos.
                    </div>
                    <div className="flex gap-6 text-sm font-semibold text-muted-foreground">
                        <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                        <a href="#" className="hover:text-primary transition-colors">Methodology</a>
                        <a href="#" className="hover:text-primary transition-colors">GitHub</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureItem({
                         icon,
                         title,
                         description
                     }: {
    icon: React.ReactNode,
    title: string,
    description: string
}) {
    return (
        <div className="space-y-4">
            {/* Instead of cloneElement, we wrap the icon in a div.
         We use 'text-primary' on the parent or target the svg via CSS
      */}
            <div className="h-12 w-12 rounded-xl border bg-background flex items-center justify-center shadow-sm [&>svg]:h-6 [&>svg]:w-6 [&>svg]:text-primary">
                {icon}
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    );
}

// 2. Updated StatCard (Simplified for the layout)
function StatCard({
                      label,
                      value,
                      trend
                  }: {
    label: string,
    value: string,
    trend: string
}) {
    return (
        <div className="p-6 rounded-2xl border bg-card/50 shadow-sm space-y-1 hover:border-primary/30 transition-colors">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {label}
            </p>
            <p className="text-2xl font-black tracking-tight">{value}</p>
            <p className="text-[10px] font-semibold text-primary">{trend}</p>
        </div>
    );
}