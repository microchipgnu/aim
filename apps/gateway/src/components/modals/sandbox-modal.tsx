'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { configurePrismSyntax } from '@/lib/aim-syntax-highlight';
import MonacoEditor from '@monaco-editor/react';
import { useState } from 'react';
import { Button } from '../ui/button';

interface SandboxModalProps {
  content: string;
}

export function SandboxModal({ content }: SandboxModalProps) {
  const [code, setCode] = useState<string>(content);
  const [logs] = useState<string[]>([]);
  const [result] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setCode(value);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        Edit
      </Button>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogTitle></DialogTitle>
        <div className="flex h-full">
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

            {/* Output Panel */}
            <ResizablePanel defaultSize={35} minSize={20}>
              <div className="h-full border-l border-border bg-background">
                <Tabs defaultValue="output" className="h-[calc(100%-2.25rem)]">
                  <TabsList className="h-9 bg-background border-b border-border">
                    <TabsTrigger
                      value="output"
                      className="data-[state=active]:bg-muted"
                    >
                      Output
                    </TabsTrigger>
                    <TabsTrigger
                      value="events"
                      className="data-[state=active]:bg-muted"
                    >
                      Events
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="output"
                    className="p-4 h-[calc(100%-2.25rem)] overflow-auto"
                  >
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                  </TabsContent>

                  <TabsContent
                    value="events"
                    className="p-4 h-[calc(100%-2.25rem)] overflow-auto"
                  >
                    {logs.map((log, i) => (
                      <div key={i} className="text-sm font-mono">
                        {log}
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
}
