import VerifyEmailClient from "./verify-email-client";

export default async function VerifyEmailPage({
                                            searchParams,
                                        }: {
    searchParams: Promise<{ token?: string; email?: string }>;
}) {
    const { token, email } = await searchParams;
    return <VerifyEmailClient token={token} email={email} />;
}
