import { PlayCircle, AlertCircle, Edit2, StopCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { unicodeToBase64 } from "../../../../utils/encode-decode";

interface ExecutionFormProps {
    frontmatter: any;
    loading: boolean;
    onExecute: (values: Record<string, any>) => void;
    onAbort?: () => void;
    rawContent: string;
}

export function ExecutionForm({ frontmatter, loading, onExecute, onAbort, rawContent }: ExecutionFormProps) {
    return (
        <Card className="h-full max-h-[calc(100vh-6rem)] sticky top-24 shadow-sm border-slate-200 flex flex-col">
            <CardHeader className="flex-none">
                <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                    <PlayCircle className="h-5 w-5 text-primary" />
                    Run
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Fill out all required fields below to execute the document
                </p>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <form 
                    id="execution-form" 
                    className="h-full flex flex-col"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const values = Object.fromEntries(formData.entries());
                        onExecute(values);
                    }}
                >
                    <ScrollArea className="flex-1">
                        {frontmatter?.input && frontmatter.input.length > 0 ? (
                            <div className="space-y-6">
                                {frontmatter.input.map((input: any) => {
                                    // Handle array type inputs
                                    if (input.type === 'array') {
                                        return (
                                            <div key={input.name} className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="flex items-center gap-1 text-sm font-medium text-foreground">
                                                        {input.name}
                                                        {input.required && (
                                                            <span className="text-destructive">*</span>
                                                        )}
                                                    </label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const form = document.getElementById('execution-form') as HTMLFormElement;
                                                            const inputs = form.querySelectorAll(`[name^="${input.name}["]`);
                                                            const newIndex = inputs.length;
                                                            const newInput = document.createElement('input');
                                                            newInput.type = 'text';
                                                            newInput.name = `${input.name}[${newIndex}]`;
                                                            newInput.className = 'w-full focus-visible:ring-2 focus-visible:ring-primary/20 transition-shadow';
                                                            form.appendChild(newInput);
                                                        }}
                                                    >
                                                        Add Item
                                                    </Button>
                                                </div>
                                                <Input
                                                    name={`${input.name}[0]`}
                                                    required={input.required}
                                                    defaultValue={input.schema?.default?.[0] || ''}
                                                    placeholder={input.schema?.example || `Enter ${input.name.toLowerCase()}`}
                                                    className="w-full focus-visible:ring-2 focus-visible:ring-primary/20 transition-shadow"
                                                    aria-describedby={input.schema?.description ? `${input.name}-desc` : undefined}
                                                />
                                            </div>
                                        );
                                    }

                                    // Handle file type inputs
                                    if (input.type === 'file') {
                                        return (
                                            <div key={input.name} className="space-y-2.5">
                                                <label 
                                                    htmlFor={input.name}
                                                    className="flex items-center gap-1 text-sm font-medium text-foreground"
                                                >
                                                    {input.name}
                                                    {input.required && (
                                                        <span className="text-destructive">*</span>
                                                    )}
                                                </label>
                                                <Input
                                                    id={input.name}
                                                    name={input.name}
                                                    type="file"
                                                    required={input.required}
                                                    className="w-full focus-visible:ring-2 focus-visible:ring-primary/20 transition-shadow"
                                                    aria-describedby={input.schema?.description ? `${input.name}-desc` : undefined}
                                                    accept={input.schema?.accept}
                                                />
                                                {input.schema?.description && (
                                                    <p 
                                                        id={`${input.name}-desc`}
                                                        className="text-sm text-muted-foreground leading-relaxed"
                                                    >
                                                        {input.schema.description}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    }

                                    // Handle regular single inputs
                                    return (
                                        <div key={input.name} className="space-y-2.5">
                                            <label 
                                                htmlFor={input.name}
                                                className="flex items-center gap-1 text-sm font-medium text-foreground"
                                            >
                                                {input.name}
                                                {input.required && (
                                                    <span className="text-destructive">*</span>
                                                )}
                                            </label>
                                            <Input
                                                id={input.name}
                                                name={input.name}
                                                required={input.required}
                                                defaultValue={input.schema?.default || ''}
                                                placeholder={input.schema?.example || input.schema?.default || `Enter ${input.name.toLowerCase()}`}
                                                className="w-full focus-visible:ring-2 focus-visible:ring-primary/20 transition-shadow"
                                                aria-describedby={input.schema?.description ? `${input.name}-desc` : undefined}
                                            />
                                            {input.schema?.description && (
                                                <p 
                                                    id={`${input.name}-desc`}
                                                    className="text-sm text-muted-foreground leading-relaxed"
                                                >
                                                    {input.schema.description}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    No input fields are required for this document
                                </AlertDescription>
                            </Alert>
                        )}
                    </ScrollArea>
                </form>
            </CardContent>
            <CardFooter className="flex-none gap-2">
                {loading ? (
                    <Button 
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            if (onAbort) onAbort();
                        }}
                        variant="destructive"
                        className="flex-1 font-medium shadow-sm transition-all hover:shadow-md"
                        aria-label="Stop execution"
                    >
                        <span className="flex items-center justify-center gap-2.5">
                            <StopCircle className="h-4 w-4" />
                            Stop Execution
                        </span>
                    </Button>
                ) : (
                    <Button 
                        type="submit"
                        form="execution-form"
                        className="flex-1 font-medium shadow-sm transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="Run"
                    >
                        Run
                    </Button>
                )}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => {
                                    window.location.href = `/_aim_/sandbox/?content=${unicodeToBase64(rawContent)}`;
                                }}
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Use sandbox to edit and run code</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardFooter>
        </Card>
    );
}