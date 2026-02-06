import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-[100dvh] bg-muted/30">
            <header className="border-b bg-background">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                    <Link href="/applications" className="font-semibold tracking-tight">
                        OfferLog
                    </Link>

                    <nav className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Link className="hover:text-foreground" href="/applications">
                            Applications
                        </Link>
                        <Link className="hover:text-foreground" href="/dashboard">
                            Dashboard
                        </Link>
                        <Link className="hover:text-foreground" href="/settings">
                            Settings
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
        </div>
    );
}
