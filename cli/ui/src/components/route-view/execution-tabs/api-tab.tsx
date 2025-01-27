import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ApiTabProps {
    path: string;
    frontmatter?: {
        input?: Array<{
            name: string;
            type: string;
        }>;
    };
}

export function ApiTab({ path, frontmatter }: ApiTabProps) {
    const baseUrl = window.location.origin;
    const apiEndpoint = `${baseUrl}/api/${path}`;

    // Generate example payload dynamically from frontmatter input
    const examplePayload = {
        input: frontmatter?.input?.reduce<Record<string, string>>((acc, input) => {
            // Generate example values based on type
            let exampleValue: string = "example";
            switch (input.type) {
                case "string":
                    exampleValue = "example string";
                    break;
                case "number":
                    exampleValue = "123";
                    break;
                case "boolean":
                    exampleValue = "true";
                    break;
                case "file":
                    exampleValue = "example.txt";
                    break;
                default:
                    exampleValue = "example value";
            }
            return { ...acc, [input.name]: exampleValue };
        }, {}) || {}
    };

    const curlExample = `curl -X POST ${apiEndpoint} \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer YOUR_API_KEY" \\
    -d '${JSON.stringify(examplePayload, null, 2)}'`;

    const fetchExample = `fetch("${apiEndpoint}", {
    method: "POST",
    headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_API_KEY"
    },
    body: JSON.stringify(${JSON.stringify(examplePayload, null, 2)})
})`;

    return (
        <Card className="h-full overflow-hidden border-slate-200">
            <CardHeader className="border-b bg-slate-50/50 px-6">
                <CardTitle className="text-lg font-semibold">
                    API Reference
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[calc(100%-5rem)] overflow-auto">
                <div className="space-y-6">
                    <div>
                        <h3 className="font-medium mb-2">Endpoint</h3>
                        <code className="bg-slate-100 px-2 py-1 rounded text-sm">
                            POST {apiEndpoint}
                        </code>
                    </div>

                    <div>
                        <h3 className="font-medium mb-2">Authentication</h3>
                        <div className="bg-slate-100 p-4 rounded text-sm">
                            <p>Authentication is required via Bearer token in the Authorization header:</p>
                            <code className="block mt-2 text-slate-800">
                                Authorization: Bearer YOUR_API_KEY
                            </code>
                        </div>
                    </div>

                    {frontmatter?.input && frontmatter.input.length > 0 && (
                        <div>
                            <h3 className="font-medium mb-2">Input Parameters</h3>
                            <div className="bg-slate-100 p-4 rounded text-sm">
                                <p className="mb-2">The API accepts the following input parameters:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    {frontmatter.input.map((input, index) => (
                                        <li key={index}>
                                            <code className="text-slate-800">{input.name}</code>
                                            <span className="text-slate-600"> ({input.type})</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="font-medium mb-2">cURL Example</h3>
                        <pre className="bg-slate-100 p-4 rounded text-sm overflow-x-auto">
                            {curlExample}
                        </pre>
                    </div>

                    <div>
                        <h3 className="font-medium mb-2">Fetch Example</h3>
                        <pre className="bg-slate-100 p-4 rounded text-sm overflow-x-auto">
                            {fetchExample}
                        </pre>
                    </div>

                    <div>
                        <h3 className="font-medium mb-2">Response Format</h3>
                        <p className="text-sm text-slate-600 mb-2">
                            The API uses Server-Sent Events (SSE) to stream execution results. Events include:
                        </p>
                        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                            <li><code className="text-slate-800">log</code> - Execution log messages</li>
                            <li><code className="text-slate-800">error</code> - Error messages</li>
                            <li><code className="text-slate-800">step</code> - Step-by-step execution progress</li>
                            <li><code className="text-slate-800">data</code> - Data events during execution</li>
                            <li><code className="text-slate-800">output</code> - Output data</li>
                            <li><code className="text-slate-800">complete</code> - Final execution result</li>
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
