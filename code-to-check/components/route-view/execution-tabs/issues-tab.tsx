import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentError } from "../route-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface IssuesTabProps {
    warnings: DocumentError[];
    errors: DocumentError[];
}

export function IssuesTab({ warnings, errors }: IssuesTabProps) {
    return (
        <Card className="h-full overflow-hidden border-slate-200">
            <CardHeader className="border-b bg-slate-50/50 px-6">
                <CardTitle className="text-lg font-semibold">Issues</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-5rem)]">
                <ScrollArea className="h-full">
                    <div className="p-6">
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
                        {warnings.length === 0 && errors.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                No issues found
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
