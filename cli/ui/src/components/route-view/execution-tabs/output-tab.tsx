import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from 'react';
import Markdoc from '@markdoc/markdoc';
import { Terminal, PlayCircle } from 'lucide-react';

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
    Loading: () => (
        <div className="flex items-center justify-center h-6 w-6">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
    ),
    Empty: () => (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <PlayCircle className="h-12 w-12 mb-4" />
            <p>Click the Run button to see execution results</p>
        </div>
    )
}

interface OutputTabProps {
    result: any[];
    isLoading?: boolean;
}

export function OutputTab({ result, isLoading = false }: OutputTabProps) {
    const processMarkdocTag = (tag: any): any => {
        if (tag?.$$mdtype === 'Tag') {
            try {
                if (tag.name && components[tag.name.charAt(0).toUpperCase() + tag.name.slice(1) as keyof typeof components]) {
                    tag.name = tag.name.charAt(0).toUpperCase() + tag.name.slice(1);
                }
                if (tag.children) {
                    tag.children = tag.children.map((child: any) => processMarkdocTag(child));
                }
                return Markdoc.renderers.react(tag, React, { components });
            } catch (err) {
                console.error('Error rendering Markdoc:', err);
                return null;
            }
        }
        return tag;
    };

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
                {result.length === 0 && !isLoading ? (
                    <components.Empty />
                ) : (
                    <div className="p-6">
                        {result.map((item, index) => {
                            if (Array.isArray(item) && item.length === 0) return null;
                            
                            let content = item;
                            if (item?.$$mdtype === 'Tag') {
                                content = processMarkdocTag(item);
                            }
                            if (!content) return null;

                            if (Array.isArray(content)) {
                                content = content.map(item => 
                                    item?.$$mdtype === 'Tag' ? processMarkdocTag(item) : item
                                );
                            }

                            return (
                                <div 
                                    key={index} 
                                    className="mb-5 last:mb-0 animate-fadeIn"
                                >
                                    {typeof content === 'string' ? content : React.createElement(React.Fragment, null, content)}
                                </div>
                            );
                        })}
                        {isLoading && (
                            <div className="flex justify-center mt-4">
                                <components.Loading />
                            </div>
                        )}
                        <div ref={resultsEndRef} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
