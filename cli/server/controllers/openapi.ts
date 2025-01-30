import type { Express } from 'express';
import { getAIMRoutes } from '../resolution';
import path from 'path';

interface RouteInfo {
    path: string;
    file: string;
    type: 'dynamic' | 'static';
    segments: number;
    extension: string;
}

function generateOpenAPISpec(routes: RouteInfo[]) {
    const paths: any = {};
    
    routes.forEach(route => {
        // Remove api/ prefix and convert [param] to {param}
        const path = '/' + route.path.replace(/^api\//, '').replace(/\[(\w+)\]/g, '{$1}');
        
        if (!paths[path]) {
            paths[path] = {};
        }
        
        // Convert file-system route to OpenAPI path parameters
        const parameters = path.match(/\{(\w+)\}/g)?.map(param => ({
            name: param.slice(1, -1),
            in: 'path',
            required: true,
            schema: {
                type: 'string'
            }
        })) || [];

        // Add both GET and POST methods for each route
        paths[path]['get'] = {
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
        };

        paths[path]['post'] = {
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
        };
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

function generateAIPlugin() {
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

export const setupManifests = async (app: Express, routesDir: string) => {
    const rawRoutes = await getAIMRoutes(routesDir);
    
    // Convert RouteFile[] to RouteInfo[] format
    const routes = rawRoutes.map(route => ({
        path: route.path.replace(/^api\//, ''),
        file: route.filePath,
        type: route.path.includes('[') ? 'dynamic' : 'static',
        segments: route.path.split('/').filter(Boolean).length,
        extension: path.extname(route.filePath).slice(1)
    })) as RouteInfo[];
    
    // Add OpenAPI and plugin.json routes
    app.get('/.well-known/openapi.json', (req, res) => {
        const spec = generateOpenAPISpec(routes);
        res.json(spec);
    });

    app.get('/.well-known/ai-plugin.json', (req, res) => {
        const plugin = generateAIPlugin();
        res.json(plugin);
    });
}