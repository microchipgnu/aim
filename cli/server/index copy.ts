import { aim, defaultRuntimeOptions, renderers, transform } from '@aim-sdk/core';
import chalk from 'chalk';
import express from 'express';
import { existsSync } from 'fs';
import { promises as fs } from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAIMRoutes } from './resolution';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Map to store abort controllers for each request
const requestAbortControllers = new Map<string, AbortController>();

interface ServerConfig {
    port: number;
    routesDir: string;
    enableUI?: boolean;
}

export async function createServer(config: ServerConfig) {
    const app = express();

    // Error handling middleware
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error(chalk.red('Server error:'), err);
        res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    });

    // API routes
    app.use('/api', express.json());

    // Abort endpoint
    app.post('/api/abort', (req, res) => {
        const requestId = req.body.requestId;
        if (!requestId) {
            console.log(chalk.yellow('Abort request received without request ID'));
            res.status(400).json({ error: 'Request ID is required' });
            return;
        }

        // Check if controller exists and is not already aborted
        const controller = requestAbortControllers.get(requestId);
        if (!controller) {
            console.log(chalk.yellow(`No active request found with ID ${requestId}`));
            res.status(404).json({ error: 'No active request found with this ID' });
            return;
        }

        if (controller.signal.aborted) {
            console.log(chalk.yellow(`Request ${requestId} was already aborted`));
            requestAbortControllers.delete(requestId);
            res.json({ message: 'Request was already aborted' });
            return;
        }

        try {
            console.log(chalk.dim(`Aborting request ${requestId}`));
            controller.abort();
            requestAbortControllers.delete(requestId);
            console.log(chalk.green(`Successfully aborted request ${requestId}`));
            res.json({ message: 'Request aborted successfully' });
        } catch (error) {
            console.error(chalk.red(`Error aborting request ${requestId}:`), error);
            res.status(500).json({ error: 'Failed to abort request' });
        }
    });

    // Get frontmatter and document info for sandbox content
    app.get('/api/aim/sandbox', express.json(), async (req: express.Request, res: express.Response) => {
        try {
            const content = req.query.content;
            if (!content || typeof content !== 'string') {
                res.status(400).json({ error: 'Content query parameter is required' });
                return;
            }

            const decodedContent = Buffer.from(content, 'base64').toString();

            const aimDocument = aim({
                content: decodedContent,
                options: {
                    config: defaultRuntimeOptions.config,
                    signals: {
                        abort: new AbortController().signal
                    },
                    settings: {
                        useScoping: false
                    }
                }
            });

            res.json({
                frontmatter: aimDocument.frontmatter,
                validation: aimDocument.errors
            });

        } catch (error) {
            console.error('Error getting document info:', error);
            res.status(500).json({ 
                error: 'Failed to get document info',
                message: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    });
    
    // Sandbox route for executing raw content
    app.post('/api/aim/sandbox', express.json(), async (req: express.Request, res: express.Response) => {
        try {
            // Set headers for SSE
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });

            const { content, input } = req.body;
            if (!content) {
                throw new Error('Content is required');
            }

            const requestId = req.headers['x-request-id'];
            if (!requestId || typeof requestId !== 'string') {
                throw new Error('Missing or invalid X-Request-ID header');
            }

            // Check for and clean up any existing request with same ID
            if (requestAbortControllers.has(requestId)) {
                const existingController = requestAbortControllers.get(requestId)!;
                existingController.abort();
                requestAbortControllers.delete(requestId);
                console.log(chalk.yellow(`Cleaned up existing request with ID ${requestId}`));
            }

            // Create abort controller and store it
            const abortController = new AbortController();
            requestAbortControllers.set(requestId, abortController);

            // Clean up on client disconnect
            req.on('close', () => {
                if (requestAbortControllers.has(requestId)) {
                    console.log(`Client disconnected for request ${requestId}`);
                    abortController.abort();
                    requestAbortControllers.delete(requestId);
                    if (!res.writableEnded) {
                        res.write(`event: abort\ndata: ${JSON.stringify({ 
                            reason: 'Client disconnected',
                            requestId 
                        })}\n\n`);
                        res.end();
                    }
                }
            });

            const aimDocument = aim({
                content,
                options: {
                    signals: {
                        abort: abortController.signal
                    },
                    events: {
                        onLog: (message) => {
                            if (!res.writableEnded) {
                                console.log(chalk.dim(`Log: ${message}`));
                                res.write(`event: log\ndata: ${JSON.stringify({ message, requestId })}\n\n`);
                            }
                        },
                        onError: (error) => {
                            if (!res.writableEnded) {
                                console.error(error);
                                res.write(`event: error\ndata: ${JSON.stringify({ error, requestId })}\n\n`);
                            }
                        },
                        onAbort: (reason) => {
                            console.warn('Execution aborted:', reason);
                            if (!res.writableEnded) {
                                res.write(`event: abort\ndata: ${JSON.stringify({ 
                                    reason: reason || 'Execution aborted by user',
                                    requestId
                                })}\n\n`);
                                res.end();
                            }
                            // Only clean up if this is still the active controller for this request
                            if (requestAbortControllers.get(requestId) === abortController) {
                                requestAbortControllers.delete(requestId);
                            }
                        },
                        onSuccess: (data) => {
                            console.log(data);
                            if (!res.writableEnded) {
                                res.write(`event: success\ndata: ${JSON.stringify({ data, requestId })}\n\n`);
                            }
                        },
                        onFinish: (data) => {
                            console.log(data);
                            if (!res.writableEnded) {
                                res.write(`event: finish\ndata: ${JSON.stringify({ data, requestId })}\n\n`);
                            }
                        },
                        onStart: (data) => {
                            console.log(data);
                            if (!res.writableEnded) {
                                res.write(`event: start\ndata: ${JSON.stringify({ data, requestId })}\n\n`);
                            }
                        },
                        onStep: (data) => {
                            console.log(data);
                            if (!res.writableEnded) {
                                res.write(`event: step\ndata: ${JSON.stringify({ data, requestId })}\n\n`);
                            }
                        },
                        onData: (data) => {
                            console.log(data);
                            if (!res.writableEnded) {
                                res.write(`event: data\ndata: ${JSON.stringify({ data, requestId })}\n\n`);
                            }
                        },
                        onOutput: async (output) => {
                            console.log(output);
                            if (!res.writableEnded) {
                                res.write(`event: output\ndata: ${JSON.stringify({ output, requestId })}\n\n`);
                            }
                        },
                        onUserInput: async (prompt) => {
                            console.log(prompt);
                            return "";
                        }
                    },
                    config: defaultRuntimeOptions.config,
                    settings: {
                        useScoping: false
                    }
                }
            });

            try {
                // Execute with generator to allow for abortion
                for await (const result of aimDocument.executeWithGenerator({
                    input: input || {}
                })) {
                    if (abortController.signal.aborted) {
                        break;
                    }
                    // Handle result based on type and send appropriate event
                    if (result && typeof result === 'object') {
                        res.write(`event: data\ndata: ${JSON.stringify({ data: result, requestId })}\n\n`);
                    }
                }

                if (!res.writableEnded) {
                    res.write(`event: complete\ndata: ${JSON.stringify({ requestId })}\n\n`);
                    res.end();
                }
            } catch (error) {
                if (!res.writableEnded) {
                    console.error(chalk.red(`Error executing sandbox content:`), error);
                    res.write(`event: error\ndata: ${JSON.stringify({
                        error: error instanceof Error ? error.message : 'Failed to execute document',
                        requestId
                    })}\n\n`);
                    res.end();
                }
            } finally {
                // Clean up abort controller only if it's still the active one for this request
                if (requestAbortControllers.get(requestId) === abortController) {
                    requestAbortControllers.delete(requestId);
                }
            }
        } catch (error) {
            // Handle outer errors
            if (!res.writableEnded) {
                console.error(chalk.red(`Error in sandbox handler:`), error);
                res.write(`event: error\ndata: ${JSON.stringify({
                    error: error instanceof Error ? error.message : 'Internal server error',
                    requestId: req.headers['x-request-id']
                })}\n\n`);
                res.end();
            }
        }
    });

    // Get AIM routes
    try {
        const routes = await getAIMRoutes(config.routesDir);
        console.log(chalk.dim(`Found ${routes.length} routes`));

        // Add index route that lists all routes
        app.get('/api', (req, res) => {
            try {
                console.log(chalk.dim(`GET /api - Listing ${routes.length} routes`));

                // Map routes and add additional metadata
                const routeInfo = routes.map(route => ({
                    path: route.path.replace(/^api\//, ''), // Remove the 'api/' prefix for client display
                    file: route.filePath,
                    // Add additional metadata
                    type: route.path.includes('[') ? 'dynamic' : 'static',
                    segments: route.path.split('/').filter(Boolean).length,
                    extension: path.extname(route.filePath).slice(1)
                }));

                // Sort routes by segments and path for consistent ordering
                routeInfo.sort((a, b) => {
                    if (a.segments === b.segments) {
                        return a.path.localeCompare(b.path);
                    }
                    return a.segments - b.segments;
                });

                res.json({
                    count: routes.length,
                    routes: routeInfo
                });
            } catch (error) {
                console.error(chalk.red('Error serving route list:'), error);
                res.status(500).json({ error: 'Failed to list routes' });
            }
        });

        // Add routes
        for (const route of routes) {
            const apiPath = route.path; // Path already includes 'api/' prefix from resolution.ts

            app.get(`/${apiPath}`, async (req, res) => {
                try {
                    console.log(chalk.dim(`GET /${apiPath} - Serving AST`));
                    const content = await fs.readFile(route.filePath, 'utf-8');
                    
                    const aimDocument = aim({
                        content,
                        options: {
                            signals: {
                                abort: new AbortController().signal
                            },
                            config: defaultRuntimeOptions.config,
                            events: {
                                onLog: (message) => console.log(chalk.dim(`Log: ${message}`))
                            },
                            settings: {
                                useScoping: false
                            }
                        }
                    });

                    if (aimDocument.errors.length > 0) {
                        console.log(chalk.red(`⚠️  ${aimDocument.errors.length} errors found in ${route.path}`));
                    }
                    if (aimDocument.warnings.length > 0) {
                        console.log(chalk.yellow(`⚠️  ${aimDocument.warnings.length} warnings found in ${route.path}`));
                    }

                    res.json({
                        document: aimDocument.ast,
                        rawContent: content,
                        rawHtml: renderers.html([transform(aimDocument.ast, defaultRuntimeOptions.config)]),
                        errors: aimDocument.errors,
                        warnings: aimDocument.warnings,
                        frontmatter: aimDocument.frontmatter
                    });
                } catch (error) {
                    console.error(chalk.red(`Error serving AST for ${apiPath}:`), error);
                    res.status(500).json({ error: 'Failed to serve AST' });
                }
            });

            app.post(`/${apiPath}`, async (req, res) => {
                try {
                    // Set headers for SSE
                    res.writeHead(200, {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive'
                    });

                    const content = await fs.readFile(route.filePath, 'utf-8');
                    const requestId = req.headers['x-request-id'];
                    if (!requestId || typeof requestId !== 'string') {
                        throw new Error('Missing or invalid X-Request-ID header');
                    }

                    // Check for and clean up any existing request with same ID
                    if (requestAbortControllers.has(requestId)) {
                        const existingController = requestAbortControllers.get(requestId)!;
                        existingController.abort();
                        requestAbortControllers.delete(requestId);
                        console.log(chalk.yellow(`Cleaned up existing request with ID ${requestId}`));
                    }

                    // Create abort controller and store it
                    const abortController = new AbortController();
                    requestAbortControllers.set(requestId, abortController);

                    // Clean up on client disconnect
                    req.on('close', () => {
                        if (requestAbortControllers.has(requestId)) {
                            console.log(`Client disconnected for request ${requestId}`);
                            abortController.abort();
                            requestAbortControllers.delete(requestId);
                            if (!res.writableEnded) {
                                res.write(`event: abort\ndata: ${JSON.stringify({ 
                                    reason: 'Client disconnected',
                                    requestId 
                                })}\n\n`);
                                res.end();
                            }
                        }
                    });

                    const aimDocument = aim({
                        content,
                        options: {
                            signals: {
                                abort: abortController.signal
                            },
                            events: {
                                onLog: (message) => {
                                    if (!res.writableEnded) {
                                        console.log(chalk.dim(`Log: ${message}`));
                                        res.write(`event: log\ndata: ${JSON.stringify({ message, requestId })}\n\n`);
                                    }
                                },
                                onError: (error) => {
                                    if (!res.writableEnded) {
                                        console.error(error);
                                        res.write(`event: error\ndata: ${JSON.stringify({ error, requestId })}\n\n`);
                                    }
                                },
                                onAbort: (reason) => {
                                    console.warn('Execution aborted:', reason);
                                    if (!res.writableEnded) {
                                        res.write(`event: abort\ndata: ${JSON.stringify({ 
                                            reason: reason || 'Execution aborted by user',
                                            requestId
                                        })}\n\n`);
                                        res.end();
                                    }
                                    // Only clean up if this is still the active controller for this request
                                    if (requestAbortControllers.get(requestId) === abortController) {
                                        requestAbortControllers.delete(requestId);
                                    }
                                },
                                onSuccess: (data) => {
                                    console.log(data);
                                    if (!res.writableEnded) {
                                        res.write(`event: success\ndata: ${JSON.stringify({ data, requestId })}\n\n`);
                                    }
                                },
                                onFinish: (data) => {
                                    console.log(data);
                                    if (!res.writableEnded) {
                                        res.write(`event: finish\ndata: ${JSON.stringify({ data, requestId })}\n\n`);
                                    }
                                },
                                onStart: (data) => {
                                    console.log(data);
                                    if (!res.writableEnded) {
                                        res.write(`event: start\ndata: ${JSON.stringify({ data, requestId })}\n\n`);
                                    }
                                },
                                onStep: (data) => {
                                    console.log(data);
                                    if (!res.writableEnded) {
                                        res.write(`event: step\ndata: ${JSON.stringify({ data, requestId })}\n\n`);
                                    }
                                },
                                onData: (data) => {
                                    console.log(data);
                                    if (!res.writableEnded) {
                                        res.write(`event: data\ndata: ${JSON.stringify({ data, requestId })}\n\n`);
                                    }
                                },
                                onOutput: async (output) => {
                                    console.log(output);
                                    if (!res.writableEnded) {
                                        res.write(`event: output\ndata: ${JSON.stringify({ output, requestId })}\n\n`);
                                    }
                                },
                                onUserInput: async (prompt) => {
                                    console.log(prompt);
                                    return "";
                                }
                            },
                            config: defaultRuntimeOptions.config,
                            settings: {
                                useScoping: false
                            }
                        }
                    });

                    try {
                        // Execute with generator to allow for abortion
                        for await (const result of aimDocument.executeWithGenerator({
                            input: req.body || {}
                        })) {
                            if (abortController.signal.aborted) {
                                break;
                            }
                            // Handle result based on type and send appropriate event
                            if (result && typeof result === 'object') {
                                res.write(`event: data\ndata: ${JSON.stringify({ data: result, requestId })}\n\n`);
                            }
                        }

                        if (!res.writableEnded) {
                            res.write(`event: complete\ndata: ${JSON.stringify({ requestId })}\n\n`);
                            res.end();
                        }
                    } catch (error) {
                        if (!res.writableEnded) {
                            console.error(chalk.red(`Error executing document for ${apiPath}:`), error);
                            res.write(`event: error\ndata: ${JSON.stringify({
                                error: error instanceof Error ? error.message : 'Failed to execute document',
                                requestId
                            })}\n\n`);
                            res.end();
                        }
                    } finally {
                        // Clean up abort controller only if it's still the active one for this request
                        if (requestAbortControllers.get(requestId) === abortController) {
                            requestAbortControllers.delete(requestId);
                        }
                    }
                } catch (error) {
                    // Handle outer errors
                    if (!res.writableEnded) {
                        console.error(chalk.red(`Error in route handler for ${apiPath}:`), error);
                        res.write(`event: error\ndata: ${JSON.stringify({
                            error: error instanceof Error ? error.message : 'Internal server error',
                            requestId: req.headers['x-request-id']
                        })}\n\n`);
                        res.end();
                    }
                }
            });
        }

        // Serve UI if enabled
        if (config.enableUI) {
            // In development, proxy to Vite dev server
            if (process.env.NODE_ENV === 'development') {
                try {
                    const { createServer: createViteServer } = await import('vite');
                    const vite = await createViteServer({
                        root: path.resolve(__dirname, '../../ui'),
                        server: { middlewareMode: true }
                    });
                    app.use(vite.middlewares);
                } catch (error) {
                    console.error(chalk.red('Failed to start Vite dev server:'), error);
                }
            } else {
                // In production, serve from the bundled UI files in dist/ui
                const uiDistPath = path.join(__dirname, 'ui');
                
                if (!existsSync(uiDistPath) || !existsSync(path.join(uiDistPath, 'index.html'))) {
                    console.error(chalk.red('UI files not found in:', uiDistPath));
                    return;
                }

                console.log(chalk.dim(`Serving UI from: ${uiDistPath}`));
                
                // Serve static files
                app.use(express.static(uiDistPath));
                
                // Handle client-side routing by serving index.html for all non-API routes
                app.get('*', (req, res, next) => {
                    if (req.path.startsWith('/api')) {
                        return next();
                    }
                    res.sendFile(path.join(uiDistPath, 'index.html'));
                });
            }
        }

    } catch (error) {
        console.error(chalk.red('Failed to initialize server:'), error);
    }

    return new Promise<void>((resolve, reject) => {
        try {
            app.listen(config.port, () => {
                resolve();
            });
        } catch (error) {
            console.error(chalk.red('Failed to start server:'), error);
            reject(error);
        }
    });
}