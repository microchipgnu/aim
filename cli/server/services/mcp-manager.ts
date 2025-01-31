import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { HttpClient, OpenAPIToMCPConverter } from 'openapi-mcp-server';
import type { Response } from 'express';
import { getAIMRoutes } from '../resolution';
import { openAPIManager } from './openapi-manager';

export class MCPManager {
    public server: Server;
    private sseTransport?: SSEServerTransport;
    private httpClient?: HttpClient;
    private tools: Record<string, any> = {};
    private openApiLookup: Record<string, any> = {};

    constructor() {
        console.log('[MCP] Initializing MCP manager...');
        this.server = new Server(
            { name: 'aim-server', version: '1.0.0' },
            { 
                capabilities: {
                    resources: {}, // Enable resources capability
                    tools: {} // Enable tools capability
                }
            }
        );

        this.setupRequestHandlers();
        console.log('[MCP] MCP manager initialized');
    }

    private setupRequestHandlers() {
        // Handle resource listing
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            const resources = Object.keys(this.tools).map(name => ({
                uri: `mcp://tools/${name}`,
                name: name,
                type: 'tool',
                description: this.tools[name].description
            }));

            return {
                resources: resources
            };
        });

        // Handle resource reading
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const uri = request.params.uri;
            const toolMatch = uri.match(/^mcp:\/\/tools\/(.+)$/);
            
            if (!toolMatch) {
                throw new Error(`Invalid resource URI: ${uri}`);
            }

            const toolName = toolMatch[1];
            const tool = this.tools[toolName];

            if (!tool) {
                throw new Error(`Tool not found: ${toolName}`);
            }

            return {
                contents: [{
                    uri: uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(tool, null, 2)
                }]
            };
        });
    }

    async initialize(routesDir: string) {
        try {
            // Get routes and generate OpenAPI spec
            console.log('[MCP] Loading and generating OpenAPI spec...');
            const routes = await getAIMRoutes(routesDir);
            await openAPIManager.initialize(routes);
            const spec = openAPIManager.generateOpenAPISpec();
            const converter = new OpenAPIToMCPConverter(spec);
            console.log('[MCP] OpenAPI spec generated and parsed');

            // Get base URL from spec
            const baseUrl = spec.servers?.[0]?.url;
            if (!baseUrl) {
                throw new Error('No base URL found in OpenAPI spec');
            }

            // Initialize HTTP client
            this.httpClient = new HttpClient({ baseUrl }, spec);

            // Convert spec to MCP tools
            const { tools, openApiLookup } = converter.convertToMCPTools();
            this.tools = tools;
            this.openApiLookup = openApiLookup;
            console.log('[MCP] Generated', Object.keys(tools).length, 'tools');
        } catch (error) {
            console.error('[MCP] Error initializing MCP manager:', error);
            throw error;
        }
    }

    handleSSEConnection(res: Response) {
        console.log('[MCP] New SSE connection established');

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Create new transport and connect server
        const transport = new SSEServerTransport('/messages', res);
        this.server.connect(transport);
        this.sseTransport = transport;

        // Send initial message to confirm connection
        res.write('data: {"type":"connection","status":"established"}\n\n');
    }

    getSSETransport() {
        return this.sseTransport;
    }

    getAvailableMethods() {
        return Object.entries(this.tools).map(([name, tool]) => {
            return tool.methods.map((method: { name: string; description: string; inputSchema: { properties: any; required: string[]; }; }) => ({
                name: `${name}-${method.name}`,
                description: method.description,
                parameters: Object.entries(method.inputSchema.properties || {}).map(([paramName, schema]) => ({
                    name: paramName,
                    type: (schema as any).type,
                    required: method.inputSchema.required?.includes(paramName) || false
                }))
            }));
        }).flat();
    }

    async executeMethod(method: string, params: any) {
        if (!this.httpClient) {
            throw new Error('HTTP client not initialized');
        }

        const operation = this.openApiLookup[method];
        if (!operation) {
            throw new Error(`Method ${method} not found`);
        }

        const response = await this.httpClient.executeOperation(operation, params || {});
        return response.data;
    }
}

export const mcpManager = new MCPManager();
