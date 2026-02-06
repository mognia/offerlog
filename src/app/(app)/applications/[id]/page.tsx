import { cookies } from "next/headers";
import ApplicationDetailClient from "./ApplicationDetailClient";

async function getApp(id: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/applications/${id}`, {
        headers: { cookie: cookies().toString() },
        cache: "no-store",
    });
    return res.json();
}

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const json = await getApp(id);

    if (!json?.ok) {
        return <main className="mx-auto max-w-5xl p-6">Not found.</main>;
    }

    return (
        <main className="mx-auto max-w-5xl p-6">
            <ApplicationDetailClient application={json.application} />
        </main>
    );
}
