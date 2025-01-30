import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import chalk from 'chalk';
import type { ServerConfig } from './config/types';
import { errorHandler } from './middleware/error';
import { setupUI } from './middleware/ui';
import { setupAbortController } from './controllers/abort';
import { setupAIMRoutes } from './controllers/aim';
import { setupRouteHandlers } from './controllers/routes';
import { setupManifests } from './controllers/openapi';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createServer(config: ServerConfig) {
    const app = express();

    // Error handling middleware
    app.use(errorHandler);

    // API routes
    app.use('/api', express.json());

    // Setup controllers
    setupAbortController(app);
    setupAIMRoutes(app);
    setupManifests(app, config.routesDir);
    
    try {
        // Setup route handlers (includes sandbox and dynamic routes)
        await setupRouteHandlers(app, config.routesDir);

        // Serve UI if enabled
        if (config.enableUI) {
            await setupUI(
                app,
                process.env.NODE_ENV === 'development',
                path.join(__dirname, 'ui')
            );
        }

    } catch (error) {
        console.error(chalk.red('Failed to initialize server:'), error);
        throw error;
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