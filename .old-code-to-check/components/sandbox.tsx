import { ExecutionForm } from '@/components/route-view/execution-form';
import { LogsTab } from '@/components/route-view/execution-tabs/logs-tab';
import { OutputTab } from '@/components/route-view/execution-tabs/output-tab';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { configurePrismSyntax } from '@/lib/aim-syntax-highlight';
import { SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import MonacoEditor from '@monaco-editor/react';
import { Loader2, PlayIcon, SaveIcon, StopCircle, Upload } from 'lucide-react';
import React from 'react';
import { base64ToUnicode, unicodeToBase64 } from '../../../utils/encode-decode';

export function Sandbox() {
  const [code, setCode] = React.useState<string>('');
  const [isRunning, setIsRunning] = React.useState(false);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [result, setResult] = React.useState<any[]>([]);
  const [showInputDialog, setShowInputDialog] = React.useState(false);
  const [frontmatter, setFrontmatter] = React.useState<any>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const requestIdRef = React.useRef<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { isSignedIn, isLoaded } = useUser();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const content = params.get('content');
    if (content) {
      try {
        setCode(base64ToUnicode(content));
      } catch (e) {
        console.error('Failed to decode content from URL:', e);
        setCode('');
      }
    }
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setCode(value);
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        setCode(text);
      } catch (error) {
        console.error('Failed to read file:', error);
        setLogs((prev) => [...prev, `Error reading file: ${error}`]);
      }
    }
  };

  const handleRun = async () => {
    try {
      const response = await fetch(
        '/api/aim/info?' +
          new URLSearchParams({
            content: unicodeToBase64(code),
          }),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to get document info');
      }

      const data = await response.json();
      setFrontmatter(data.frontmatter);

      if (data.frontmatter?.input && data.frontmatter.input.length > 0) {
        setShowInputDialog(true);
        return;
      }
      await executeCode({});
    } catch (e) {
      console.error('Failed to parse frontmatter:', e);
      setFrontmatter(null);
      setLogs((prev) => [...prev, `Error: ${e}`]);
    }
  };

  const handleAbort = async () => {
    if (requestIdRef.current) {
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        const response = await fetch(`/api/abort/${requestIdRef.current}`, {
          method: 'POST',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to abort request');
        }

        setIsRunning(false);
        setLogs((prev) => [...prev, 'Execution aborted']);
        abortControllerRef.current = null;
        requestIdRef.current = '';
      } catch (error) {
        console.error('Failed to abort execution:', error);
      }
    }
  };

  const executeCode = async (variables: Record<string, any>) => {
    try {
      setIsRunning(true);
      setLogs([]);
      setResult([]);
      setShowInputDialog(false);

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const response = await fetch('/api/aim/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: unicodeToBase64(code),
          input: variables,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error('Failed to execute code');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      requestIdRef.current = response.headers.get('Request-Id') || '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.message) {
                setLogs((prev) => [...prev, `Log: ${data.message}`]);
              }
              if (data.error) {
                setLogs((prev) => [...prev, `Error: ${data.error}`]);
              }
              if (data.output) {
                setResult((prev) => [...prev, data.output]);
              }
              if (data.data) {
                setResult((prev) => [...prev, data.data]);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      setLogs((prev) => [...prev, 'Execution completed']);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error('Failed to execute code:', error);
        setLogs((prev) => [...prev, `Error: ${error}`]);
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
      requestIdRef.current = '';
    }
  };

  const handleSave = async () => {
    try {
      const blob = new Blob([code], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sandbox-code.aim';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex flex-col bg-[#1e1e1e] text-white overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }
  if (isLoaded && !isSignedIn) {
    return (
      <div className="h-screen w-full flex flex-col bg-[#1e1e1e] text-white overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full space-y-6">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <h2 className="text-2xl font-bold">Welcome to AIM Sandbox</h2>
            <p className="text-gray-400">
              This is an interactive environment where you can write, test and
              experiment with AIM code. Sign in to get started.
            </p>
          </div>
          <SignInButton mode="modal" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#1e1e1e] text-white overflow-hidden">
      {/* Top Bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#252526] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-4">
          <a href="/" className="text-sm font-medium hover:text-[#007acc]">
            AIM Sandbox
          </a>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".aim,.md"
            className="hidden"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpload}
            disabled={isRunning}
            className="h-7 px-2 hover:bg-[#3c3c3c]"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isRunning}
            className="h-7 px-2 hover:bg-[#3c3c3c]"
          >
            <SaveIcon className="h-4 w-4" />
          </Button>
          {isRunning ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAbort}
              className="h-7 px-3 bg-red-600 hover:bg-red-700 text-white"
            >
              <StopCircle className="h-4 w-4 mr-1" />
              Stop
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRun}
              className="h-7 px-3 bg-[#007acc] hover:bg-[#1b8bd4] text-white"
            >
              <PlayIcon className="h-4 w-4 mr-1" />
              Run
            </Button>
          )}
          <UserButton />
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
              padding: { top: 8 },
            }}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Panel */}
        <ResizablePanel defaultSize={35} minSize={20}>
          <div className="h-full border-l border-border bg-background">
            <Tabs defaultValue="output" className="h-[calc(100%-2.25rem)]">
              <TabsList className="h-9 bg-background border-b border-border">
                <TabsTrigger
                  value="output"
                  className="data-[state=active]:bg-muted transition-colors"
                >
                  Output
                </TabsTrigger>
                <TabsTrigger
                  value="events"
                  className="data-[state=active]:bg-muted relative transition-colors"
                >
                  Events
                  {logs.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center animate-in fade-in">
                      {logs.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="output"
                className="p-4 h-[calc(100%-2.25rem)] overflow-auto"
              >
                <OutputTab result={result} isLoading={isRunning} />
              </TabsContent>

              <TabsContent
                value="events"
                className="p-4 h-[calc(100%-2.25rem)] overflow-auto"
              >
                <LogsTab logs={logs} />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <Dialog open={showInputDialog} onOpenChange={setShowInputDialog}>
        <DialogContent>
          <ExecutionForm
            frontmatter={frontmatter}
            loading={isRunning}
            onExecute={executeCode}
            onAbort={handleAbort}
            rawContent={code}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
