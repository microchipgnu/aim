"use client";

import { AuthModal } from "@/components/modals/auth-modal";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { configurePrismSyntax } from "@/lib/aim-syntax-highlight";
import MonacoEditor from '@monaco-editor/react';
import { Loader2, PlayIcon, SaveIcon, Upload } from "lucide-react";
import React from 'react';

export default function SandboxPage() {
    const [code, setCode] = React.useState<string>('');
    const [isRunning, setIsRunning] = React.useState(false);
    const [logs, setLogs] = React.useState<string[]>([]);
    const [result, setResult] = React.useState<any[]>([]);
    const [showInputDialog, setShowInputDialog] = React.useState(false);
    const [frontmatter, setFrontmatter] = React.useState<any>(null);
    const abortControllerRef = React.useRef<AbortController | null>(null);
    const requestIdRef = React.useRef<string>('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleEditorChange = (value: string | undefined) => {
        if (value) {
            setCode(value);
        }
    };

    const handleUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const text = await file.text();
                setCode(text);
            } catch (error) {
                console.error('Failed to read file:', error);
                setLogs(prev => [...prev, `Error reading file: ${error}`]);
            }
        }
    };

    const handleRun = async () => {
        try {
            setLogs([]);
            setResult([]);
            setIsRunning(true);

            // Create new AbortController and request ID for this execution
            abortControllerRef.current = new AbortController();
            requestIdRef.current = Math.random().toString(36).substring(7);
            const signal = abortControllerRef.current.signal;

            const response = await fetch(`${process.env.NEXT_PUBLIC_INFERENCE_URL}/aim/v1/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                    'X-Request-ID': requestIdRef.current
                },
                body: JSON.stringify({
                    content: code
                }),
                signal
            }).catch(err => {
                if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
                    throw new Error('Connection refused - Server may be down');
                }
                throw err;
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
                                    setLogs(prev => [...prev, `Error: ${data.error}`]);
                                }
                                break;
                            case 'complete':
                                setIsRunning(false);
                                break;
                            case 'success':
                                if (data.data !== undefined) {
                                    setResult(prev => [...prev, data.data]);
                                }
                                break;
                            case 'data':
                                if (data.data !== undefined) {
                                    setResult(prev => [...prev, data.data]);
                                }
                                break;
                            case 'abort':
                                setIsRunning(false);
                                setLogs(prev => [...prev, `Aborted: ${data.reason || 'Execution aborted'}`]);
                                // Clean up abort controller on server-side abort
                                abortControllerRef.current = null;
                                requestIdRef.current = '';
                                break;
                        }
                    } catch (err) {
                        console.error('Error processing event:', err);
                    }
                }
            }
        } catch (err) {
            if (err instanceof Error) {
                if (err.name === 'AbortError') {
                    console.log('Fetch aborted');
                    setLogs(prev => [...prev, 'Execution aborted']);
                } else {
                    setLogs(prev => [...prev, `Error: ${err.message || 'Failed to execute code'}`]);
                    console.error(err);
                }
            } else {
                setLogs(prev => [...prev, 'Failed to execute code']);
                console.error(err);
            }
        } finally {
            setIsRunning(false);
            // Only clean up if not already cleaned up by abort event
            if (abortControllerRef.current) {
                abortControllerRef.current = null;
                requestIdRef.current = '';
            }
        }
    };

    const handleSave = async () => {
        try {
            const blob = new Blob([code], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sandbox-code.txt';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to save file:', error);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col bg-background text-foreground overflow-hidden">
            {/* Top Bar */}
            <div className="h-12 flex items-center justify-between px-4 border-b">
                <div className="flex items-center gap-4">
                    <a href="/" className="text-sm font-medium hover:text-primary">Sandbox</a>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".txt,.md"
                        className="hidden"
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUpload}
                        disabled={isRunning}
                        className="h-7 px-2"
                    >
                        <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSave}
                        disabled={isRunning}
                        className="h-7 px-2"
                    >
                        <SaveIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleRun}
                        disabled={isRunning}
                        className="h-7 px-3"
                    >
                        {isRunning ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <PlayIcon className="h-4 w-4 mr-1" />
                        )}
                        Run
                    </Button>
                    <AuthModal />
                </div>
            </div>

            {/* Main Content */}
            <ResizablePanelGroup direction="horizontal" className="flex-1">
                {/* Editor */}
                <ResizablePanel defaultSize={65} minSize={30}>
                    <MonacoEditor
                        height="100%"
                        defaultLanguage="aim"
                        theme="aim-dark"
                        value={code}
                        onChange={handleEditorChange}
                        beforeMount={configurePrismSyntax}
                        options={{
                            minimap: { enabled: true },
                            fontSize: 14,
                            wordWrap: 'on',
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            lineNumbers: 'on',
                            glyphMargin: true,
                            folding: true,
                            lineDecorationsWidth: 10,
                            bracketPairColorization: { enabled: true },
                            padding: { top: 8 }
                        }}
                    />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Output Panel */}
                <ResizablePanel defaultSize={35} minSize={20}>
                    <div className="h-full border-l border-border bg-background">
                        <Tabs defaultValue="output" className="h-[calc(100%-2.25rem)]">
                            <TabsList className="h-9 bg-background border-b border-border">
                                <TabsTrigger value="output">Output</TabsTrigger>
                                <TabsTrigger value="logs">Logs</TabsTrigger>
                            </TabsList>

                            <TabsContent value="output" className="p-4 h-[calc(100%-2.25rem)] overflow-auto">
                                <pre className="whitespace-pre-wrap">
                                    {result.join('\n')}
                                </pre>
                            </TabsContent>

                            <TabsContent value="logs" className="p-4 h-[calc(100%-2.25rem)] overflow-auto">
                                {logs.map((log, i) => (
                                    <div key={i} className="text-sm mb-1">{log}</div>
                                ))}
                            </TabsContent>
                        </Tabs>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
