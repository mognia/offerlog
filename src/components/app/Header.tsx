import React from 'react'
import Link from "next/link";

function Header() {
    return (
        <header className="border-b bg-background">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                <Link href="/applications" className="font-semibold tracking-tight">
                    OfferLog
                </Link>

                <nav className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Link className="hover:text-foreground" href="/applications">
                        Applications
                    </Link>
                    <div className='flex items-center gap-2 flex-row'>

                            <Link className="hover:text-foreground" href="/dashboard">
                                Dashboard
                            </Link>

                    </div>
                    {/*<Link className="hover:text-foreground" href="/settings">*/}
                    {/*    Settings*/}
                    {/*</Link>*/}
                </nav>
            </div>
        </header>
    )
}

export default Header
