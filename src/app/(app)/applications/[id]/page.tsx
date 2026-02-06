import ApplicationDetailClient from "./ApplicationDetailClient";

export default async function ApplicationPage({
                                                  params,
                                              }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-6">
            <ApplicationDetailClient applicationId={id} />
        </main>
    );
}
