import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import { ExecutionForm } from "./execution-form";
import { ApiTab } from "./execution-tabs/api-tab";
import { ContentTab } from "./execution-tabs/content-tab";
import { IssuesTab } from "./execution-tabs/issues-tab";
import { LogsTab } from "./execution-tabs/logs-tab";
import { OutputTab } from "./execution-tabs/output-tab";
import { Navigation } from "./navigation";

export interface DocumentError {
    type: string;
    lines: number[];
    location: {
        start: { line: number };
        end: { line: number };
    };
    error: {
        id: string;
        level: 'warning' | 'critical';
        message: string;
    };
}

export function RouteView({ path, isFullscreen }: { path: string, isFullscreen: boolean }) {
    const [loading, setLoading] = React.useState(false);
    const [ast, setAst] = React.useState<any>(null);
    const [result, setResult] = React.useState<any[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [frontmatter, setFrontmatter] = React.useState<any>(null);
    const [warnings, setWarnings] = React.useState<DocumentError[]>([]);
    const [errors, setErrors] = React.useState<DocumentError[]>([]);
    const [logs, setLogs] = React.useState<string[]>([]);
    const [output, setOutput] = React.useState<string>('');
    const [rawContent, setRawContent] = React.useState<string>('');
    const [htmlContent, setHtmlContent] = React.useState<string>('');

    const fetchAst = async () => {
        try {
            const response = await fetch(`/api/${path}`);
            const data = await response.json();

            console.log(output, htmlContent);
            setAst(data.document);
            setWarnings(data.warnings);
            setErrors(data.errors);
            setFrontmatter(data.frontmatter);
            setRawContent(data.rawContent || '');
            setHtmlContent(data.rawHtml || '');
        } catch (err) {
            setError('Failed to load document');
            console.error(err);
        }
    };

    React.useEffect(() => {
        // Clear all state when path changes
        setLoading(false);
        setAst(null);
        setResult([]);
        setError(null);
        setFrontmatter(null);
        setWarnings([]);
        setErrors([]);
        setLogs([]);
        setOutput('');
        setRawContent('');
        setHtmlContent('');

        fetchAst();
    }, [path]);

    const executeDocument = async (variables: Record<string, any> = {}) => {
        try {
            setLogs([]);
            setResult([]);
            setError(null);
            setOutput('');
            setLoading(true);

            const response = await fetch(`/api/${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(variables)
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('Failed to get response reader');
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const events = chunk.split('\n\n').filter(Boolean);

                for (const event of events) {
                    try {
                        const [eventLine, dataLine] = event.split('\n');
                        if (!eventLine || !dataLine) continue;

                        const eventType = eventLine.replace('event: ', '');
                        let data;
                        try {
                            data = JSON.parse(dataLine.replace('data: ', ''));
                        } catch (parseErr) {
                            console.warn('Failed to parse event data:', parseErr);
                            continue;
                        }

                        if (!data) continue;

                        // Add all events to logs
                        setLogs(prev => [...prev, `${eventType}: ${JSON.stringify(data)}`]);

                        switch (eventType) {
                            case 'log':
                                if (typeof data.message === 'string') {
                                    setLogs(prev => [...prev, data.message]);
                                }
                                break;
                            case 'error':
                                if (typeof data.error === 'string') {
                                    setError(data.error);
                                }
                                break;
                            case 'complete':
                                if (data.result !== undefined) {
                                    setResult(prev => [...prev, data.result]);
                                }
                                break;
                            case 'success':
                                if (data.data !== undefined) {
                                    setResult(prev => [...prev, data.data]);
                                }
                                break;
                            case 'output':
                                if (data.output !== undefined) {
                                    setOutput(data.output);
                                    setResult(prev => [...prev, data.output]);
                                }
                                break;
                            case 'data':
                                if (data.data !== undefined) {
                                    setResult(prev => [...prev, data.data]);
                                }
                                break;
                        }
                    } catch (err) {
                        console.error('Error processing event:', err);
                    }
                }
            }
        } catch (err) {
            setError('Failed to execute document');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-background">
            {!isFullscreen && <Navigation 
                path={path}
            />}
            
            <div className={`${isFullscreen ? 'h-screen p-4' : 'container mx-auto px-4 pb-12'}`}>
                {!isFullscreen && (
                    <header className="mb-10 pt-24">
                        <div className="max-w-3xl">
                            <h1 className="text-4xl font-bold tracking-tighter text-foreground">
                                {frontmatter?.title || path}
                            </h1>
                            {frontmatter?.description && (
                                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                                    {frontmatter.description}
                                </p>
                            )}
                        </div>
                    </header>
                )}

                {error && (
                    <Alert variant="destructive" className="mb-8 max-w-3xl animate-in fade-in slide-in-from-top-1">
                        <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                    </Alert>
                )}

                <div className={`grid grid-cols-12 gap-8 ${isFullscreen ? 'h-[calc(100vh-2rem)]' : 'h-[calc(100vh-300px)]'}`}>
                    <div className={`${isFullscreen ? 'col-span-3' : 'col-span-12 lg:col-span-4'} h-full`}>
                        <ExecutionForm
                            frontmatter={frontmatter}
                            loading={loading}
                            onExecute={executeDocument}
                        />
                    </div>

                    <div className={`${isFullscreen ? 'col-span-9' : 'col-span-12 lg:col-span-8'} overflow-auto h-full`}>
                        <Tabs defaultValue="output" className="h-full w-full">
                            <TabsList className="w-full justify-start space-x-2 rounded-lg bg-muted p-1">
                                <TabsTrigger value="output" className="flex-1">Output</TabsTrigger>
                                <TabsTrigger value="api" className="flex-1">API</TabsTrigger>
                                <TabsTrigger value="events" className="flex-1 relative">
                                    Events
                                    {logs.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                            {logs.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
                                <TabsTrigger value="issues" className="flex-1 relative">
                                    Issues
                                    {(warnings.length + errors.length) > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                            {warnings.length + errors.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="output" className="mt-6 h-[calc(100%-4rem)]">
                                <OutputTab result={result} isLoading={loading} />
                            </TabsContent>

                            <TabsContent value="api" className="mt-6 h-[calc(100%-4rem)]">
                                <ApiTab path={path} frontmatter={frontmatter} />
                            </TabsContent>

                            <TabsContent value="events" className="mt-6 h-[calc(100%-4rem)]">
                                <LogsTab logs={logs} />
                            </TabsContent>

                            <TabsContent value="content" className="mt-6 h-[calc(100%-4rem)]">
                                <ContentTab rawContent={rawContent} htmlContent={htmlContent} ast={ast} />
                            </TabsContent>

                            <TabsContent value="issues" className="mt-6 h-[calc(100%-4rem)]">
                                <IssuesTab warnings={warnings} errors={errors} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}