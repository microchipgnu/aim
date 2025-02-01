import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle } from 'lucide-react';
import React from 'react';
import {
    renderers
} from '@markdoc/markdoc';

const styles = `
.output-preview h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: rgb(30, 41, 59);
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
    line-height: 1.75;
}

.output-preview p {
    display: block;
    padding: 0.5rem 0;
    margin: 0.5rem 0;
    color: #475569;
    line-height: 1.6;
    font-size: 1rem;
}

.output-preview ai {
    display: inline-block;
    padding: 0.75rem 1rem;
    margin: 0.5rem 0.25rem;
    border: 1px solid #60a5fa;
    border-radius: 0.375rem;
    background-color: #f0f7ff;
    color: #2563eb;
    font-weight: 500;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
}

.output-preview ai:hover {
    background-color: #e0f2fe;
    border-color: #3b82f6;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.output-preview if {
    display: block;
    padding: 0.75rem;
    margin: 0.5rem 0;
    border: 2px solid #60a5fa;
    border-radius: 0.375rem;
    background-color: #eff6ff;
    position: relative;
}

.output-preview else {
    display: block;
    padding: 0.75rem;
    margin: 0.5rem 0;
    border: 1px solid #60a5fa;
    border-radius: 0.375rem;
    background-color: #f0f7ff;
    color: #2563eb;
    font-weight: 500;
}

.output-preview loop {
    display: block;
    padding: 1rem;
    margin: 1rem 0;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    background-color: #f9fafb;
    position: relative;
}

.output-preview .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 1.5rem;
    width: 1.5rem;
}

.output-preview .loading div {
    animation: spin 1s linear infinite;
    height: 1rem;
    width: 1rem;
    border-radius: 9999px;
    border-bottom: 2px solid rgb(59 130 246);
}

.output-preview .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--muted-foreground);
}

.output-preview .empty-state svg {
    height: 3rem;
    width: 3rem;
    margin-bottom: 1rem;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
`;

interface OutputTabProps {
    result: any[];
    isLoading?: boolean;
}

export function OutputTab({ result, isLoading = false }: OutputTabProps) {
    // Create a ref to scroll to bottom
    const resultsEndRef = React.useRef<HTMLDivElement>(null);

    // Scroll to bottom when new results come in
    React.useEffect(() => {
        if (resultsEndRef.current) {
            resultsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [result]);

    return (
        <Card className="h-full overflow-hidden border-slate-200">
            <CardHeader className="border-b bg-slate-50/50 px-6">
                <CardTitle className="text-lg font-semibold">
                    Execution Results
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-5rem)] overflow-auto">
                <style>{styles}</style>
                <div className="output-preview">
                    {result.length === 0 && !isLoading ? (
                        <div className="empty-state">
                            <PlayCircle />
                            <p>Click the Run button to see execution results</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            {result.map((item, index) => {
                                if (Array.isArray(item) && item.length === 0) return null;
                                if (!item) return null;

                                return (
                                    <div
                                        key={index}
                                        className="animate-fadeIn"
                                        dangerouslySetInnerHTML={{ __html: renderers.html(item) }}
                                    />
                                );
                            })}
                            {isLoading && (
                                <div className="flex justify-center mt-4">
                                    <div className="loading">
                                        <div />
                                    </div>
                                </div>
                            )}
                            <div ref={resultsEndRef} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
