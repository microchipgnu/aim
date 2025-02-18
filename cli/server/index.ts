import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import type { ServerConfig } from './config/types';
import { setupRouteHandlers } from './controllers/routes';
import { errorHandler } from './middleware/error';
import { getAIMRoutes } from './resolution';
import { getHomePage } from './pages/home';
import { getHtmlOutput } from './pages/output';
import path from 'node:path';
import { promises as fs } from 'node:fs';

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
        res.send(getHomePage(routes));
    });

    app.get('/runs', async (req, res) => {
        const outputDir = path.join(process.cwd(), 'output');
        try {
            const files = await fs.readdir(outputDir);
            const runs = files
                .filter(file => file.endsWith('.html'))
                .map(file => ({
                    id: file.replace('.html', ''),
                    path: `/run/${file.replace('.html', '')}`
                }));

            const content = `
                <h1>All Runs</h1>
                <ul>
                    ${runs.map(run => `
                        <li><a href="${run.path}">Run ${run.id}</a></li>
                    `).join('')}
                </ul>
            `;
            res.send(content);
        } catch (error) {
            console.error(chalk.red('Error reading runs directory:'), error);
            res.status(500).send(getHtmlOutput('Error', '<p>Failed to list runs</p>'));
        }
    });

    app.get('/run/:id', async (req, res) => {
        const requestId = req.params.id;
        const outputPath = path.join(process.cwd(), 'output', `${requestId}.html`);

        try {
            const content = await fs.readFile(outputPath, 'utf-8');
            res.send(content);
        } catch (error) {
            console.error(chalk.red('Error reading output file:'), error);
            res.status(404).send(getHtmlOutput('Not Found', '<p>Run output not found</p>'));
        }
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