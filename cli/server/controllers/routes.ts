import chalk from 'chalk';
import type { Express } from 'express';
import { promises as fs } from 'fs';
import { getFilePage } from '../pages/file';
import { type RouteInfo } from '../resolution';
import { AIMManager } from '../services/aim-manager';
import loadConfig from '../../utils/load-config';
import path from 'node:path';

export async function setupRouteHandlers(app: Express, routes: RouteInfo[]) {

    let config;
    try {
        config = await loadConfig({
            configPath: path.join(process.cwd(), 'aim.config.ts'),
            defaultConfig: {
                tools: [],
                env: {},
                plugins: []
            }
        });
    } catch (error) {
        console.error(chalk.red('Failed to load config:'), error);
        config = {
            tools: [],
            env: {},
            plugins: []
        };
    }

    const aimManager = new AIMManager(routes, config.tools, config.env, config.plugins);
    try {
        // Add individual routes
        for (const route of routes) {
            const apiPath = route.path; // Path already includes 'api/' prefix from resolution.ts

            // GET handler for route AST/info
            app.get(`/${apiPath}`, async (req, res) => {
                try {
                    console.log(chalk.dim(`GET /${apiPath} - Serving content`));
                    const content = await fs.readFile(route.file, 'utf-8');
                    const ast = await aimManager.getDocumentAST(route.file);

                    // Check Accept header to determine response format
                    const acceptHeader = req.headers.accept;
                    if (acceptHeader && acceptHeader.includes('application/json')) {
                        // Return JSON if specifically requested
                        res.json({
                            document: ast.document,
                            rawContent: content,
                            rawHtml: ast.rawHtml,
                            errors: ast.errors,
                            warnings: ast.warnings,
                            frontmatter: ast.frontmatter
                        });
                    } else {
                        // Return styled HTML page
                        res.send(getFilePage(apiPath, ast.rawHtml, content, ast.frontmatter));
                    }
                } catch (error) {
                    console.error(chalk.red(`Error serving content for ${apiPath}:`), error);
                    res.status(500).send(`
                        <!DOCTYPE html>
                        <html>
                            <head>
                                <title>Error</title>
                                <style>
                                    body {
                                        font-family: system-ui, -apple-system, sans-serif;
                                        max-width: 800px;
                                        margin: 0 auto;
                                        padding: 2rem;
                                    }
                                    h1 { color: #dc2626; }
                                </style>
                            </head>
                            <body>
                                <h1>Error</h1>
                                <p>Failed to serve content</p>
                            </body>
                        </html>
                    `);
                }
            });
            app.get(`/${apiPath}.json`, async (req, res) => {
                try {
                    console.log(chalk.dim(`GET /${apiPath} - Serving content`));
                    const content = await fs.readFile(route.file, 'utf-8');
                    const ast = await aimManager.getDocumentAST(route.file);

                    res.json({
                        document: ast.document,
                        rawContent: content,
                        rawHtml: ast.rawHtml,
                        errors: ast.errors,
                        warnings: ast.warnings,
                        frontmatter: ast.frontmatter
                    });
                } catch (error) {
                    console.error(chalk.red(`Error serving content for ${apiPath}:`), error);
                    res.status(500).send(`
                        <!DOCTYPE html>
                        <html>
                            <head>
                                <title>Error</title>
                                <style>
                                    body {
                                        font-family: system-ui, -apple-system, sans-serif;
                                        max-width: 800px;
                                        margin: 0 auto;
                                        padding: 2rem;
                                    }
                                    h1 { color: #dc2626; }
                                </style>
                            </head>
                            <body>
                                <h1>Error</h1>
                                <p>Failed to serve content</p>
                            </body>
                        </html>
                    `);
                }
            });

            // POST handler for route execution
            app.post(`/${apiPath}`, async (req, res) => {
                try {
                    const content = await fs.readFile(route.file, 'utf-8');
                    const requestId = req.headers['x-request-id'];
                    if (!requestId || typeof requestId !== 'string') {
                        throw new Error('Missing or invalid X-Request-ID header');
                    }

                    // Execute document without SSE
                    await aimManager.executeDocumentLocally(content, req.body || {}, requestId);

                    // Redirect to run page
                    res.redirect(`/run/${requestId}`);

                } catch (error) {
                    console.error(chalk.red(`Error in route handler for ${apiPath}:`), error);
                    res.status(500).json({
                        error: error instanceof Error ? error.message : 'Internal server error',
                        requestId: req.headers['x-request-id']
                    });
                }
            });
        }

    } catch (error) {
        console.error(chalk.red('Error setting up route handlers:'), error);
        throw error;
    }
}