import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import Markdoc from "@markdoc/markdoc";
import { AlertCircle, FileText, ListChecks, PlayCircle, Terminal } from "lucide-react";
import React from 'react';
import { Link } from 'react-router-dom';

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

const components = {
    P: (props: any) => <p className="text-foreground">{props.children}</p>,
    Ai: (props: any) => (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 my-2">
            <Terminal className="h-5 w-5" />
            <span className="font-medium">{JSON.stringify(props?.children)}</span>
        </div>
    ),
    If: (props: any) => (
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-gray-50 my-2">
            <div className="flex items-center gap-2">
                <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">if {props.condition}</span>
            </div>
            <div className="pl-4 border-l-2 border-gray-200">
                {props.children}
            </div>
        </div>
    ),
    Else: (props: any) => (
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-gray-50 my-2">
            <div className="flex items-center gap-2">
                <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">else</span>
            </div>
            <div className="pl-4 border-l-2 border-gray-200">
                {props.children}
            </div>
        </div>
    ),
    Loop: (props: any) => (
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-gray-50 my-2">
            <div className="flex items-center gap-2">
                <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">loop {props.count} times</span>
            </div>
            <div className="pl-4 border-l-2 border-gray-200">
                {props.children}
            </div>
        </div>
    ),
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
    const [dataEvents, setDataEvents] = React.useState<any[]>([]);
    const [output, setOutput] = React.useState<string>('');
    const [rawContent, setRawContent] = React.useState<string>('');
    const [htmlContent, setHtmlContent] = React.useState<string>('');

    console.log(output, htmlContent)

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
        setDataEvents([]);
        setOutput('');
        setRawContent('');
        setHtmlContent('');

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
            setRawContent(data.rawContent || '');
            setHtmlContent(data.htmlContent || '');
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
            setDataEvents([]);
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

                        // Validate data before using
                        if (!data) continue;

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
                            case 'step':
                                if (data) {
                                    setSteps(prev => [...prev, data]);
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
                                    setDataEvents(prev => [...prev, data]);
                                    setResult(prev => [...prev, data.data]);
                                }
                                break;
                        }
                    } catch (eventErr) {
                        console.warn('Error processing event:', eventErr);
                        continue;
                    }
                }
            }

        } catch (err) {
            console.error('Document execution error:', err);
            setError(err instanceof Error ? err.message : 'Failed to execute document');
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
                        
                        {logs.length > 0 && (
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <FileText className="h-5 w-5 text-blue-500" />
                                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                            {logs.length}
                                        </span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Execution Logs</SheetTitle>
                                    </SheetHeader>
                                    <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
                                        <pre className="text-sm font-mono whitespace-pre-wrap break-all bg-muted p-4 rounded-lg">
                                            {logs.join('\n')}
                                        </pre>
                                    </ScrollArea>
                                </SheetContent>
                            </Sheet>
                        )}

                        {steps.length > 0 && (
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <ListChecks className="h-5 w-5 text-green-500" />
                                        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                            {steps.length}
                                        </span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Execution Steps</SheetTitle>
                                    </SheetHeader>
                                    <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
                                        <div className="space-y-2">
                                            {steps.map((step, index) => (
                                                <pre key={index} className="text-sm font-mono whitespace-pre-wrap break-all bg-muted p-4 rounded-lg">
                                                    {JSON.stringify(step, null, 2)}
                                                </pre>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </SheetContent>
                            </Sheet>
                        )}

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
                <header className="mb-10 pt-24">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">
                        {frontmatter?.title || path}
                    </h1>
                    {frontmatter?.description && (
                        <p className="mt-3 text-lg text-muted-foreground leading-relaxed max-w-3xl">
                            {frontmatter.description}
                        </p>
                    )}
                </header>

                {error && (
                    <Alert variant="destructive" className="mb-8 max-w-3xl">
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-12 gap-10">
                    <div className="col-span-12 lg:col-span-4">
                        <Card className="sticky top-24 shadow-sm border-slate-200">
                            <CardHeader className="border-b border-slate-100">
                                <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                                    <PlayCircle className="h-5 w-5 text-primary" />
                                    Execute Document
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const values = Object.fromEntries(formData.entries());
                                    executeDocument(values);
                                }}>
                                    {frontmatter?.input && frontmatter.input.length > 0 && (
                                        <div className="space-y-6 mb-6">
                                            {frontmatter.input.map((input: any) => (
                                                <div key={input.name} className="space-y-2.5">
                                                    <label className="text-sm font-medium block text-foreground">
                                                        {input.name}
                                                    </label>
                                                    <Input
                                                        name={input.name}
                                                        defaultValue={input.schema?.default || ''}
                                                        placeholder={input.schema?.default || ''}
                                                        className="w-full focus:ring-2 focus:ring-primary/20"
                                                    />
                                                    {input.schema?.description && (
                                                        <p className="text-sm text-muted-foreground/80 leading-relaxed">
                                                            {input.schema.description}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Button type="submit" disabled={loading} className="w-full font-medium shadow-sm transition-all hover:shadow-md">
                                        {loading ? (
                                            <span className="flex items-center gap-2.5">
                                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Executing...
                                            </span>
                                        ) : 'Execute Document'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="col-span-12 lg:col-span-8">
                        <Tabs defaultValue="output" className="w-full">
                            <TabsList>
                                <TabsTrigger value="output">Output</TabsTrigger>
                                <TabsTrigger value="state">State</TabsTrigger>
                                <TabsTrigger value="data">Data</TabsTrigger>
                                <TabsTrigger value="ast">AST</TabsTrigger>
                                <TabsTrigger value="content">Content</TabsTrigger>
                            </TabsList>

                            <TabsContent value="output">
                                {result.length > 0 && (
                                    <Card className="shadow-sm border-slate-200">
                                        <CardHeader className="border-b border-slate-100">
                                            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                                                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Execution Results
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <ScrollArea className="h-[600px]">
                                                <div className="p-6">
                                                    {result.map((item, index) => {
                                                        // Skip empty arrays
                                                        if (Array.isArray(item) && item.length === 0) {
                                                            return null;
                                                        }

                                                        let content = item;
                                                        
                                                        const processMarkdocTag = (tag: any): any => {
                                                            if (tag?.$$mdtype === 'Tag') {
                                                                try {
                                                                    // Ensure first letter of tag is uppercase to match component keys
                                                                    if (tag.name && components[tag.name.charAt(0).toUpperCase() + tag.name.slice(1) as keyof typeof components]) {
                                                                        tag.name = tag.name.charAt(0).toUpperCase() + tag.name.slice(1);
                                                                    }

                                                                    // Process children recursively
                                                                    if (tag.children) {
                                                                        tag.children = tag.children.map((child: any) => processMarkdocTag(child));
                                                                    }

                                                                    // Parse the Markdoc tag into React elements
                                                                    return Markdoc.renderers.react(tag, React, { components });
                                                                } catch (err) {
                                                                    console.error('Error rendering Markdoc:', err);
                                                                    return null;
                                                                }
                                                            }
                                                            return tag;
                                                        };

                                                        if (item?.$$mdtype === 'Tag') {
                                                            content = processMarkdocTag(item);
                                                        }

                                                        if (!content) {
                                                            return null;
                                                        }

                                                        // Handle arrays that contain Markdoc tags
                                                        if (Array.isArray(content)) {
                                                            content = content.map((item) => {
                                                                if (item?.$$mdtype === 'Tag') {
                                                                    return processMarkdocTag(item);
                                                                }
                                                                return item;
                                                            });
                                                        }

                                                        return (
                                                            <div key={index} className="mb-5 last:mb-0">
                                                                {typeof content === 'string' ? content : React.createElement(React.Fragment, null, content)}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="state">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>State Logs</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[600px]">
                                            <pre className="text-sm font-mono whitespace-pre-wrap">
                                                {logs.join('\n')}
                                            </pre>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="data">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Data Events</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[600px]">
                                            <pre className="text-sm font-mono whitespace-pre-wrap">
                                                {JSON.stringify(dataEvents, null, 2)}
                                            </pre>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="ast">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>AST</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[600px]">
                                            <pre className="text-sm font-mono whitespace-pre-wrap">
                                                {JSON.stringify(ast, null, 2)}
                                            </pre>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="content">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Raw Content</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[600px]">
                                            <pre className="text-sm font-mono whitespace-pre-wrap">
                                                {rawContent}
                                            </pre>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}
