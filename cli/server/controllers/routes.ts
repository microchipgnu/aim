import chalk from 'chalk';
import type { Express } from 'express';
import { promises as fs } from 'fs';
import { getAIMRoutes } from '../resolution';
import { aimManager, type AIMResponse } from '../services/aim-manager';

export async function setupRouteHandlers(app: Express, routesDir: string) {
    try {
        // Get all AIM routes using the resolution helper
        const routes = await getAIMRoutes(routesDir);
        console.log(chalk.dim(`Found ${routes.length} routes`));

        // Add index route that lists all routes
        app.get('/api', (req, res) => {
            try {
                console.log(chalk.dim(`GET /api - Listing ${routes.length} routes`));

                // Map routes and add additional metadata
                const routeInfo = routes.map(route => ({
                    path: route.path.replace(/^api\//, ''), // Remove the 'api/' prefix for client display
                    file: route.file,
                    type: route.type,
                    segments: route.segments,
                    extension: route.extension
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

        // Add individual routes
        for (const route of routes) {
            const apiPath = route.path; // Path already includes 'api/' prefix from resolution.ts

            // GET handler for route AST/info
            app.get(`/${apiPath}`, async (req, res) => {
                try {
                    console.log(chalk.dim(`GET /${apiPath} - Serving AST`));
                    const content = await fs.readFile(route.file, 'utf-8');
                    const ast = await aimManager.getDocumentAST(route.file);

                    // Include additional info like warnings and frontmatter
                    res.json({
                        document: ast.document,
                        rawContent: content,
                        rawHtml: ast.rawHtml,
                        errors: ast.errors,
                        warnings: ast.warnings,
                        frontmatter: ast.frontmatter
                    });
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

                    const content = await fs.readFile(route.file, 'utf-8');
                    const requestId = req.headers['x-request-id'];
                    if (!requestId || typeof requestId !== 'string') {
                        throw new Error('Missing or invalid X-Request-ID header');
                    }

                    // Create response wrapper for SSE
                    const aimResponse: AIMResponse = {
                        writableEnded: false,
                        write: (data: string) => res.write(data),
                        end: () => {
                            res.end();
                            aimResponse.writableEnded = true;
                        }
                    };

                    // Handle client disconnect
                    req.on('close', () => {
                        if (!aimResponse.writableEnded) {
                            console.log(chalk.dim(`Client disconnected for request ${requestId}`));
                            aimResponse.write(`event: abort\ndata: ${JSON.stringify({ 
                                reason: 'Client disconnected',
                                requestId 
                            })}\n\n`);
                            aimResponse.end();
                        }
                    });

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