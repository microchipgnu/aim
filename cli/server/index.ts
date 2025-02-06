import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import type { ServerConfig } from './config/types';
import { setupRouteHandlers } from './controllers/routes';
import { errorHandler } from './middleware/error';
import { getAIMRoutes } from './resolution';

export async function createServer(config: ServerConfig) {
    const app = express();

    // Get all AIM routes using the resolution helper
    const routes = await getAIMRoutes(config.routesDir);
    // Sort routes by segments and path for consistent ordering
    routes.sort((a, b) => {
        if (a.segments === b.segments) {
            return a.path.localeCompare(b.path);
        }
        return a.segments - b.segments;
    });
    console.log(chalk.dim(`\nFound ${routes.length} routes\n`));

    // Enable CORS for all routes
    app.use(cors());
    // Error handling middleware
    app.use(errorHandler);

    app.get('/', (req, res) => {
        res.send(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>AIM Local Server</title>
                    <style>
                        body {
                            font-family: system-ui, -apple-system, sans-serif;
                            max-width: 800px;
                            margin: 0 auto;
                            padding: 2rem;
                            line-height: 1.6;
                        }
                        h1 {
                            color: #2563eb;
                            border-bottom: 2px solid #e5e7eb;
                            padding-bottom: 0.5rem;
                        }
                        .route-card {
                            background: #f8fafc;
                            border: 1px solid #e5e7eb;
                            border-radius: 8px;
                            padding: 1rem;
                            margin: 1rem 0;
                        }
                        .route-path {
                            font-family: monospace;
                            font-size: 1.1em;
                            color: #0f172a;
                        }
                        .route-file {
                            color: #64748b;
                            font-size: 0.9em;
                        }
                        .http-method {
                            display: inline-block;
                            padding: 0.25rem 0.5rem;
                            border-radius: 4px;
                            font-size: 0.8em;
                            font-weight: 600;
                            margin-right: 0.5rem;
                        }
                        .get {
                            background: #dbeafe;
                            color: #1e40af;
                        }
                        .post {
                            background: #dcfce7;
                            color: #166534;
                        }
                        .endpoint-details {
                            margin-top: 0.5rem;
                            padding-left: 1rem;
                            border-left: 2px solid #e5e7eb;
                        }
                    </style>
                </head>
                <body>
                    <h1>AIM Local Server</h1>
                    <p>Welcome to the AIM Local Server.</p>
                    <p>For more information, please visit <a href="https://aim.microchipgnu.pt">https://aim.microchipgnu.pt</a></p>
                    
                    <h2>Available Routes</h2>
                    <div class="routes">
                        ${routes.map(route => `
                            <div class="route-card">
                                <a class="route-path" href="/${route.path}">/${route.path}</a>
                                <div class="route-file">${route.file}</div>
                                <div class="endpoint-details">
                                    <div>
                                        <span class="http-method get">GET</span>
                                        Returns the AST and metadata for this route
                                    </div>
                                    <div>
                                        <span class="http-method post">POST</span>
                                        Executes the AIM document with provided input
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <h2>API Information</h2>
                    <div class="route-card">
                        <div class="route-path">/api/process</div>
                        <div class="endpoint-details">
                            <div>
                                <span class="http-method post">POST</span>
                                Process an AIM document
                                <br>
                                <small>Requires: { content: string, input?: object }</small>
                            </div>
                        </div>
                    </div>

                    <div class="route-card">
                        <div class="route-path">/api/info</div>
                        <div class="endpoint-details">
                            <div>
                                <span class="http-method get">GET</span>
                                Get information about an AIM document
                                <br>
                                <small>Query params: content (required)</small>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `);
    });

    // Then setup other routes and middleware
    app.use(express.json());
    await setupRouteHandlers(app, routes);

    return new Promise<void>(async (resolve, reject) => {
        try {
            app.listen(config.port, async () => {
                try {
                    resolve();
                } catch (error) {
                    console.error(chalk.red('Failed to setup manifests:'), error);
                    reject(error);
                }
            });
        } catch (error) {
            console.error(chalk.red('Failed to start server:'), error);
            reject(error);
        }
    });
}