import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlayCircle } from 'lucide-react';
import ReactJson from 'react-json-view';

interface LogsTabProps {
  logs: string[];
}

export function LogsTab({ logs }: LogsTabProps) {
  return (
    <Card className="h-full overflow-hidden border-slate-200">
      <CardHeader className="border-b bg-slate-50/50 px-6">
        <CardTitle className="text-lg font-semibold">Logs</CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-5rem)]">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <PlayCircle className="h-12 w-12 mb-4" />
            <p>Click the Run button to see execution logs</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-6 space-y-2">
              {logs.map((log, index) => {
                try {
                  const jsonData = JSON.parse(log);
                  return (
                    <div key={index}>
                      <ReactJson
                        src={jsonData}
                        theme="rjv-default"
                        name={null}
                        collapsed={2}
                        enableClipboard={false}
                        displayDataTypes={false}
                      />
                    </div>
                  );
                } catch {
                  return (
                    <div
                      key={index}
                      className="text-sm font-mono bg-muted/50 p-2 rounded"
                    >
                      {log}
                    </div>
                  );
                }
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
