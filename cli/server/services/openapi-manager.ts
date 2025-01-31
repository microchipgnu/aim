import type { RouteInfo } from "../resolution";

export class OpenAPIManager {
    private routes: RouteInfo[] = [];

    async initialize(routes: RouteInfo[]) {
        this.routes = routes;
    }

    generateOpenAPISpec() {
        const paths: any = {};
        
        this.routes.forEach(route => {
            const path = '/' + route.path.replace(/^api\//, '').replace(/\[(\w+)\]/g, '{$1}');
            
            if (!paths[path]) {
                paths[path] = {};
            }
            
            const parameters = path.match(/\{(\w+)\}/g)?.map(param => ({
                name: param.slice(1, -1),
                in: 'path',
                required: true,
                schema: {
                    type: 'string'
                }
            })) || [];

            const operationId = path
                .replace(/^\//, '')
                .replace(/\//g, '_')
                .replace(/\{(\w+)\}/g, '$1')
                .replace(/[^a-zA-Z0-9_]/g, '_');

            paths[path] = this.generatePathOperations(path, operationId, parameters);
        });

        return {
            openapi: '3.0.1',
            info: {
                title: 'AIM Server API',
                description: 'Dynamic API specification for AIM Server',
                version: '1.0'
            },
            servers: [
                {
                    url: 'http://localhost:3000'
                }
            ],
            paths
        };
    }

    generateAIPlugin() {
        return {
            schema_version: "v1",
            name_for_human: "AIM Server Plugin",
            name_for_model: "aim_server", 
            description_for_human: "Plugin for interacting with the AIM server, allowing execution of AIM documents and management of requests.",
            description_for_model: "API for executing AIM documents, managing request lifecycles, and retrieving document information. Supports Server-Sent Events (SSE) for real-time updates.",
            auth: {
                type: "none"
            },
            api: {
                type: "openapi",
                url: "http://localhost:3000/openapi.json"
            },
            logo_url: "http://localhost:3000/logo.png",
            contact_email: "support@example.com",
            legal_info_url: "http://example.com/legal"
        };
    }

    private generatePathOperations(path: string, operationId: string, parameters: any[]) {
        return {
            get: {
                operationId: `get_${operationId}`,
                summary: `GET ${path}`,
                parameters,
                responses: {
                    '200': {
                        description: 'Returns route AST and metadata',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        document: { type: 'object' },
                                        rawContent: { type: 'string' },
                                        rawHtml: { type: 'string' },
                                        errors: { type: 'array' },
                                        warnings: { type: 'array' },
                                        frontmatter: { type: 'object' }
                                    }
                                }
                            }
                        }
                    },
                    '500': {
                        description: 'Server error',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        error: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                operationId: `post_${operationId}`,
                summary: `POST ${path}`,
                parameters: [
                    ...parameters,
                    {
                        name: 'X-Request-ID',
                        in: 'header',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    '200': {
                        description: 'Server-sent events stream',
                        content: {
                            'text/event-stream': {
                                schema: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                }
            }
        };
    }
}

export const openAPIManager = new OpenAPIManager();
