import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@clerk/clerk-react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const { getToken } = useAuth();
  const [bearerToken, setBearerToken] = useState<string>('');
  const [showToken, setShowToken] = useState(false);
  const baseUrl = window.location.origin;
  const apiEndpoint = `${baseUrl}/api/${path}`;

  const generateToken = async () => {
    const token = await getToken({ template: 'API' });
    setBearerToken(token || '');
    setShowToken(false);
  };

  useEffect(() => {
    generateToken();
  }, [getToken]);

  // Generate example payload dynamically from frontmatter input
  const examplePayload = {
    input:
      frontmatter?.input?.reduce<Record<string, string>>((acc, input) => {
        // Generate example values based on type
        let exampleValue = 'example';
        switch (input.type) {
          case 'string':
            exampleValue = 'example string';
            break;
          case 'number':
            exampleValue = '123';
            break;
          case 'boolean':
            exampleValue = 'true';
            break;
          case 'file':
            exampleValue = 'example.txt';
            break;
          default:
            exampleValue = 'example value';
        }
        return { ...acc, [input.name]: exampleValue };
      }, {}) || {},
  };

  const curlExample = `curl -X POST ${apiEndpoint} \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer ${bearerToken}" \\
    -H "X-Request-ID: YOUR_REQUEST_ID" \\
    -d '${JSON.stringify(examplePayload, null, 2)}'`;

  const fetchExample = `fetch("${apiEndpoint}", {
    method: "POST",
    headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer ${bearerToken}",
        "X-Request-ID": "YOUR_REQUEST_ID"
    },
    body: JSON.stringify(${JSON.stringify(examplePayload, null, 2)})
})`;

  return (
    <Card className="h-full overflow-hidden border-slate-200">
      <CardHeader className="border-b bg-slate-50/50 px-6">
        <CardTitle className="text-lg font-semibold">API Reference</CardTitle>
      </CardHeader>
      <CardContent className="p-6 h-[calc(100%-5rem)] overflow-auto">
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Endpoint</h3>
            <div className="relative">
              <code className="block bg-slate-100 px-2 py-1 rounded text-sm overflow-x-auto">
                POST {apiEndpoint}
              </code>
              <button
                className="absolute top-1 right-1 p-1 hover:bg-slate-200 rounded"
                onClick={() =>
                  navigator.clipboard.writeText(`POST ${apiEndpoint}`)
                }
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Required Headers</h3>
            <div className="bg-slate-100 p-4 rounded text-sm">
              <p>The following headers are required:</p>
              <div className="relative mt-2 space-y-2">
                <code className="block text-slate-800 overflow-x-auto">
                  Authorization: Bearer {showToken ? bearerToken : '********'}
                </code>
                <code className="block text-slate-800 overflow-x-auto">
                  X-Request-ID: YOUR_REQUEST_ID
                </code>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={generateToken}>
                      Generate New Token
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <button
                    className="p-1 hover:bg-slate-200 rounded"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `Authorization: Bearer ${bearerToken}\nX-Request-ID: YOUR_REQUEST_ID`,
                      )
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {frontmatter?.input && frontmatter.input.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Input Parameters</h3>
              <div className="bg-slate-100 p-4 rounded text-sm">
                <p className="mb-2">
                  The API accepts the following input parameters:
                </p>
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
            <div className="relative">
              <pre className="bg-slate-100 p-4 rounded text-sm overflow-x-auto">
                {showToken
                  ? curlExample
                  : curlExample.replace(bearerToken, '********')}
              </pre>
              <button
                className="absolute top-2 right-2 p-1 hover:bg-slate-200 rounded"
                onClick={() => navigator.clipboard.writeText(curlExample)}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Fetch Example</h3>
            <div className="relative">
              <pre className="bg-slate-100 p-4 rounded text-sm overflow-x-auto">
                {showToken
                  ? fetchExample
                  : fetchExample.replace(bearerToken, '********')}
              </pre>
              <button
                className="absolute top-2 right-2 p-1 hover:bg-slate-200 rounded"
                onClick={() => navigator.clipboard.writeText(fetchExample)}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Response Format</h3>
            <p className="text-sm text-slate-600 mb-2">
              The API uses Server-Sent Events (SSE) to stream execution results.
              Events include:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              <li>
                <code className="text-slate-800">log</code> - Execution log
                messages
              </li>
              <li>
                <code className="text-slate-800">error</code> - Error messages
              </li>
              <li>
                <code className="text-slate-800">step</code> - Step-by-step
                execution progress
              </li>
              <li>
                <code className="text-slate-800">data</code> - Data events
                during execution
              </li>
              <li>
                <code className="text-slate-800">output</code> - Output data
              </li>
              <li>
                <code className="text-slate-800">complete</code> - Final
                execution result
              </li>
              <li>
                <code className="text-slate-800">abort</code> - Client
                disconnection notification
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
