import { Link } from "react-router-dom";

interface NavigationProps {
    path: string;
}

export function Navigation({ path }: NavigationProps) {
    return (
        <nav className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b z-50">
            <div className="flex h-16 items-center px-4 md:px-6">
                <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </Link>
                <div className="ml-auto flex items-center space-x-4">
                    <div className="text-sm text-muted-foreground">{path}</div>
                </div>
            </div>
        </nav>
    );
}