import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ServerConfig } from './config/types';
import { setupAbortController } from './controllers/abort';
import { setupAIMRoutes } from './controllers/aim';
import { setupMCPController } from './controllers/mcp';
import { setupManifests } from './controllers/openapi';
import { setupRouteHandlers } from './controllers/routes';
import { errorHandler } from './middleware/error';
import { setupUI } from './middleware/ui';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createServer(config: ServerConfig) {
    const app = express();

    // Enable CORS for all routes
    app.use(cors());
    // Error handling middleware
    app.use(errorHandler);

    // Setup MCP controller first
    await setupMCPController(app, config.routesDir);

    // Then setup other routes and middleware
    app.use('/api', express.json());
    setupAbortController(app);
    setupAIMRoutes(app);
    await setupManifests(app, config.routesDir);
    await setupRouteHandlers(app, config.routesDir);

    // UI middleware last
    if (config.enableUI) {
        await setupUI(
            app,
            process.env.NODE_ENV === 'development',
            path.join(__dirname, 'ui')
        );
    }

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