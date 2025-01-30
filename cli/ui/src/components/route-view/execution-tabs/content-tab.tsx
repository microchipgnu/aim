import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactJson from 'react-json-view';
import { ScrollArea } from "@/components/ui/scroll-area";
import MonacoEditor from '@monaco-editor/react';
import { configurePrismSyntax } from "@/lib/aim-syntax-highlight";

interface ContentTabProps {
    rawContent: string;
    htmlContent: string;
    ast: any;
}

export function ContentTab({ rawContent, htmlContent, ast }: ContentTabProps) {
    return (
        <Card className="h-full overflow-hidden border-slate-200">
            <CardHeader className="border-b bg-slate-50/50 px-6">
                <CardTitle className="text-lg font-semibold">
                    Content View
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-5rem)]">
                <Tabs defaultValue="markdown" className="h-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-slate-50/50 px-6">
                        <TabsTrigger value="markdown">Markdown</TabsTrigger>
                        <TabsTrigger value="html">HTML</TabsTrigger>
                        <TabsTrigger value="ast">AST</TabsTrigger>
                    </TabsList>

                    <ScrollArea className="h-[calc(100%-44px)]">
                        <TabsContent value="markdown" className="p-6 m-0">
                            <MonacoEditor
                                height="400px"
                                defaultLanguage="aim"
                                theme="aim-light"
                                value={rawContent}
                                beforeMount={configurePrismSyntax}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    wordWrap: 'on',
                                    lineNumbers: 'off',
                                    folding: false,
                                    lineDecorationsWidth: 0,
                                    lineNumbersMinChars: 0,
                                    glyphMargin: false,
                                    scrollBeyondLastLine: false,
                                    padding: { top: 8 }
                                }}
                            />
                        </TabsContent>

                        <TabsContent value="html" className="p-6 m-0">
                            <div className="content-preview">
                                <style scoped>
                                    {`
                                    .content-preview h1 {
                                        font-size: 1.5rem;
                                        font-weight: 600;
                                        color: rgb(30, 41, 59);
                                        padding-top: 0.75rem;
                                        padding-bottom: 0.75rem;
                                        margin-top: 0.75rem;
                                        margin-bottom: 0.75rem;
                                        line-height: 1.75;
                                    }
                                    .content-preview p {
                                        display: block;
                                        padding: 0.5rem 0;
                                        margin: 0.5rem 0;
                                        color: #475569;
                                        line-height: 1.6;
                                        font-size: 1rem;
                                    }
                                    .content-preview loop {
                                        display: block;
                                        padding: 1rem;
                                        margin: 1rem 0;
                                        border: 2px solid #e5e7eb;
                                        border-radius: 0.5rem;
                                        background-color: #f9fafb;
                                        position: relative;
                                    }
                                    .content-preview if {
                                        display: block;
                                        padding: 0.75rem;
                                        margin: 0.5rem 0;
                                        border: 2px solid #60a5fa;
                                        border-radius: 0.375rem;
                                        background-color: #eff6ff;
                                        position: relative;
                                    }
                                    .content-preview else {
                                        display: block;
                                        padding: 0.75rem;
                                        margin: 0.5rem 0;
                                        border: 1px solid #60a5fa;
                                        border-radius: 0.375rem;
                                        background-color: #f0f7ff;
                                        color: #2563eb;
                                        font-weight: 500;
                                    }
                                    .content-preview ai {
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
                                    .content-preview ai:hover {
                                        background-color: #e0f2fe;
                                        border-color: #3b82f6;
                                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                                    }
                                    .content-preview fence {
                                        display: none;
                                    }
                                    `}
                                </style>
                                <div className="content-preview" dangerouslySetInnerHTML={{ __html: htmlContent }} />
                            </div>
                        </TabsContent>

                        <TabsContent value="ast" className="p-6 m-0">
                            {ast && (
                                <ReactJson
                                    src={ast}
                                    theme="rjv-default"
                                    name={null}
                                    collapsed={2}
                                    enableClipboard={false}
                                    displayDataTypes={false}
                                    style={{
                                        backgroundColor: 'transparent',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            )}
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </CardContent>
        </Card>
    );
}
