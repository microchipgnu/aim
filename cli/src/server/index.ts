import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { aim } from '@aim-sdk/core';
import { promises as fs } from 'node:fs';
import { getAIMRoutes } from './resolution';
import chalk from 'chalk';
import { existsSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
                            config: {},
                            events: {
                                onLog: (message) => console.log(chalk.dim(`Log: ${message}`))
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
                    console.log(chalk.dim(`POST /${apiPath} - Executing document`));
                    const content = await fs.readFile(route.filePath, 'utf-8');

                    // Set up SSE headers
                    res.setHeader('Content-Type', 'text/event-stream');
                    res.setHeader('Cache-Control', 'no-cache');
                    res.setHeader('Connection', 'keep-alive');

                    const aimDocument = aim({
                        content,
                        options: {
                            signal: new AbortController().signal,
                            events: {
                                onLog: (message) => {
                                    console.log(chalk.dim(`Log: ${message}`));
                                    res.write(`event: log\ndata: ${JSON.stringify({message})}\n\n`);
                                },
                                onError: (error) => {
                                    console.error(error);
                                    res.write(`event: error\ndata: ${JSON.stringify({error})}\n\n`);
                                },
                                onSuccess: (data) => {
                                    console.log(data);
                                    res.write(`event: success\ndata: ${JSON.stringify({data})}\n\n`);
                                },
                                onAbort: (reason) => {
                                    console.warn(reason);
                                    res.write(`event: abort\ndata: ${JSON.stringify({reason})}\n\n`);
                                },
                                onFinish: (data) => {
                                    console.log(data);
                                    res.write(`event: finish\ndata: ${JSON.stringify({data})}\n\n`);
                                },
                                onStart: (data) => {
                                    console.log(data);
                                    res.write(`event: start\ndata: ${JSON.stringify({data})}\n\n`);
                                },
                                onStep: (data) => {
                                    console.log(data);
                                    res.write(`event: step\ndata: ${JSON.stringify({data})}\n\n`);
                                },
                                onData: (data) => {
                                    console.log(data);
                                    res.write(`event: data\ndata: ${JSON.stringify({data})}\n\n`);
                                },
                                onOutput: async (output) => {
                                    console.log(output);
                                    res.write(`event: output\ndata: ${JSON.stringify({output})}\n\n`);
                                },
                                onUserInput: async (prompt) => {
                                    console.log(prompt);
                                    res.write(`event: prompt\ndata: ${JSON.stringify({prompt})}\n\n`);
                                    return "";
                                }
                            },
                            config: {}
                        }
                    });

                    // Get input variables directly from request body
                    const input = req.body || {};

                    console.log(chalk.dim(`Executing with input variables:`, JSON.stringify(input, null, 2)));

                    // Execute with input from body
                    const result = await aimDocument.execute({
                        input
                    });

                    console.log(chalk.green(`✓ Execution completed for ${route.path}`));

                    // Send final result
                    res.write(`event: complete`);
                    res.end();

                } catch (error) {
                    console.error(chalk.red(`Error executing document for ${apiPath}:`), error);
                    res.write(`event: error\ndata: ${JSON.stringify({error: 'Failed to execute document'})}\n\n`);
                    res.end();
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