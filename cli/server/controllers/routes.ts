import type { Express } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import express from 'express';
import { aimManager, type AIMResponse } from '../services/aim-manager';

interface Route {
    path: string;
    filePath: string;
}

export async function setupRouteHandlers(app: Express, routesDir: string) {
    try {
        // Ensure routes directory exists
        const routesDirExists = await fs.access(routesDir)
            .then(() => true)
            .catch(() => false);

        if (!routesDirExists) {
            console.warn(chalk.yellow(`Routes directory not found: ${routesDir}`));
            return;
        }

        // Read all route files
        const files = await fs.readdir(routesDir);
        const routes: Route[] = [];

        // Build routes array
        for (const file of files) {
            if (file.endsWith('.aim') || file.endsWith('.md')) {
                const filePath = path.join(routesDir, file);
                const extension = path.extname(file);
                const routePath = `api/${path.basename(file, extension)}`;
                routes.push({ path: routePath, filePath });
            }
        }

        console.log(chalk.dim(`Found ${routes.length} routes`));

        // Add index route that lists all routes
        app.get('/api', (req, res) => {
            try {
                console.log(chalk.dim(`GET /api - Listing ${routes.length} routes`));

                const routeInfo = routes.map((route: Route) => ({
                    path: route.path.replace(/^api\//, ''),
                    file: route.filePath,
                    type: route.path.includes('[') ? 'dynamic' : 'static',
                    segments: route.path.split('/').filter(Boolean).length,
                    extension: path.extname(route.filePath).slice(1)
                }));

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

        // Add individual routes
        for (const route of routes) {
            const apiPath = route.path;

            // GET handler for route AST/info
            app.get(`/${apiPath}`, async (req, res) => {
                try {
                    console.log(chalk.dim(`GET /${apiPath} - Serving AST`));
                    const ast = await aimManager.getDocumentAST(route.filePath);
                    res.json(ast);
                } catch (error) {
                    console.error(chalk.red(`Error serving AST for ${apiPath}:`), error);
                    res.status(500).json({ error: 'Failed to serve AST' });
                }
            });

            // POST handler for route execution
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

                    const aimResponse: AIMResponse = {
                        writableEnded: false,
                        write: (data: string) => res.write(data),
                        end: () => res.end()
                    };

                    await aimManager.executeDocument(content, req.body || {}, requestId, aimResponse);

                } catch (error) {
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

    } catch (error) {
        console.error(chalk.red('Error setting up route handlers:'), error);
        throw error;
    }
}