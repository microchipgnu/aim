import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";
import React from 'react';
import { Link } from 'react-router-dom';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface DocumentError {
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

export function RouteView({ path }: { path: string }) {
    const [loading, setLoading] = React.useState(false);
    const [ast, setAst] = React.useState<any>(null);
    const [result, setResult] = React.useState<any[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [frontmatter, setFrontmatter] = React.useState<any>(null);
    const [warnings, setWarnings] = React.useState<DocumentError[]>([]);
    const [errors, setErrors] = React.useState<DocumentError[]>([]);
    const [logs, setLogs] = React.useState<string[]>([]);
    const [steps, setSteps] = React.useState<any[]>([]);

    React.useEffect(() => {
        // Clear all state when path changes
        console.log(ast)
        setLoading(false);
        setAst(null);
        setResult([]);
        setError(null);
        setFrontmatter(null);
        setWarnings([]);
        setErrors([]);
        setLogs([]);
        setSteps([]);
        
        fetchAst();
    }, [path]);

    const fetchAst = async () => {
        try {
            const response = await fetch(`/api/${path}`);
            const data = await response.json();

            setAst(data.document);
            setWarnings(data.warnings);
            setErrors(data.errors);
            setFrontmatter(data.frontmatter);
        } catch (err) {
            setError('Failed to load document');
            console.error(err);
        }
    };

    const executeDocument = async (variables: Record<string, any> = {}) => {
        try {
            setLogs([]);
            setSteps([]);
            setResult([]);
            setError(null);
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
                    const [eventLine, dataLine] = event.split('\n');
                    if (!eventLine || !dataLine) continue;

                    const eventType = eventLine.replace('event: ', '');
                    const data = JSON.parse(dataLine.replace('data: ', ''));

                    switch (eventType) {
                        case 'log':
                            setLogs(prev => [...prev, data.message]);
                            break;
                        case 'error':
                            setError(data.error);
                            break;
                        case 'step':
                            setSteps(prev => [...prev, data]);
                            break;
                        case 'complete':
                            if (data.result) {
                                setResult(prev => [...prev, data.result]);
                            }
                            break;
                        case 'success':
                            if (data.data) {
                                setResult(prev => [...prev, data.data]);
                            }
                            break;
                        case 'output':
                            if (data.output) {
                                setResult(prev => [...prev, data.output]);
                            }
                            break;
                        case 'data':
                            if (data.data) {
                                setResult(prev => [...prev, data.data]);
                            }
                            break;
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
        <div className="min-h-screen bg-background">
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
                        {(warnings.length > 0 || errors.length > 0) && (
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <AlertCircle className="h-8 w-8 text-yellow-500" />
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                            {warnings.length + errors.length}
                                        </span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Document Issues</SheetTitle>
                                    </SheetHeader>
                                    <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
                                        {errors.length > 0 && (
                                            <div className="mb-6">
                                                <h3 className="text-destructive font-medium mb-3 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-destructive"></span>
                                                    Errors ({errors.length})
                                                </h3>
                                                <div className="space-y-2">
                                                    {errors.map((error, index) => (
                                                        <div key={index} className="text-sm p-3 bg-destructive/10 rounded-md text-destructive">
                                                            <div className="font-medium">Error on lines {error.lines.join(', ')}</div>
                                                            <div>{error.error.message}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {warnings.length > 0 && (
                                            <div>
                                                <h3 className="text-yellow-600 font-medium mb-3 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                                    Warnings ({warnings.length})
                                                </h3>
                                                <div className="space-y-2">
                                                    {warnings.map((warning, index) => (
                                                        <div key={index} className="text-sm p-3 bg-yellow-100/50 rounded-md text-yellow-800">
                                                            <div className="font-medium">Warning on lines {warning.lines.join(', ')}</div>
                                                            <div>{warning.error.message}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </ScrollArea>
                                </SheetContent>
                            </Sheet>
                        )}
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 pb-12">
                <header className="mb-8 pt-20">
                    <h1 className="text-3xl font-semibold tracking-tight">
                        {frontmatter?.title || path}
                    </h1>
                    {frontmatter?.description && (
                        <p className="mt-2 text-muted-foreground">{frontmatter.description}</p>
                    )}
                </header>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-5 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Execute Document</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const values = Object.fromEntries(formData.entries());
                                    executeDocument(values);
                                }}>
                                    {frontmatter?.input && frontmatter.input.length > 0 && (
                                        <div className="space-y-4 mb-4">
                                            {frontmatter.input.map((input: any) => (
                                                <div key={input.name} className="space-y-2">
                                                    <label className="text-sm font-medium block">{input.name}</label>
                                                    <Input
                                                        name={input.name}
                                                        defaultValue={input.schema?.default || ''}
                                                        placeholder={input.schema?.default || ''}
                                                        className="w-full"
                                                    />
                                                    {input.schema?.description && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {input.schema.description}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Button type="submit" disabled={loading} className="w-full">
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Executing...
                                            </span>
                                        ) : 'Execute'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {logs.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Execution Logs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[300px]">
                                        <pre className="text-sm font-mono whitespace-pre-wrap break-all bg-muted p-4 rounded-lg">
                                            {logs.join('\n')}
                                        </pre>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}

                        {steps.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Execution Steps</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[300px]">
                                        <div className="space-y-2">
                                            {steps.map((step, index) => (
                                                <pre key={index} className="text-sm font-mono whitespace-pre-wrap break-all bg-muted p-4 rounded-lg">
                                                    {JSON.stringify(step, null, 2)}
                                                </pre>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="col-span-12 lg:col-span-7 space-y-6">
                        {result.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Results
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[400px]">
                                        {result.map((item, index) => (
                                            <div key={index} className="mb-4 last:mb-0">
                                                <pre className="text-sm font-mono bg-muted p-4 rounded-lg overflow-auto">
                                                    {JSON.stringify(item, null, 2)}
                                                </pre>
                                            </div>
                                        ))}
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
