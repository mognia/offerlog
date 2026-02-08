export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className=" bg-background">
            <div className="">
                {children}
            </div>
        </div>
    );
}
