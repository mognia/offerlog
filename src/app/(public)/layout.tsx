export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-[100dvh] bg-background">
            <div className="mx-auto flex min-h-[100dvh] w-full max-w-6xl items-center justify-center px-4">
                {children}
            </div>
        </div>
    );
}
