import Link from "next/link";
import {isSessionValid} from "@/lib/auth/validate-session";
import {redirect} from "next/navigation";
import Header from "@/components/app/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const sessionValid = await isSessionValid();

    if (!sessionValid.ok) {
        redirect("/login");
    }

    return (
        <div className="min-h-[100dvh] bg-muted/30">
            <Header />

            <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
        </div>
    );
}
