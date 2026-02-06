import ResendVerifyClient from "./resend-verify-client";

export default async function ResendVerifyPage({
                                             searchParams,
                                         }: {
    searchParams: Promise<{  email?: string }>;
}) {
    const { email } = await searchParams;

    return <ResendVerifyClient initialEmail={email} />;
}
