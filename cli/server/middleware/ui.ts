import type { Express } from 'express';
import express from 'express';
import { existsSync } from 'fs';
import path from 'path';
import chalk from 'chalk';

export async function setupUI(app: Express, isDevelopment: boolean, uiDistPath: string) {
    // Add route to expose publishable key
    app.get('/api/config', (req, res) => {
        res.json({
            clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY
        });
    });

    if (isDevelopment) {
        try {
            const { createServer: createViteServer } = await import('vite');
            const vite = await createViteServer({
                root: path.resolve(uiDistPath, '../ui'),
                server: { middlewareMode: true },
                envPrefix: 'VITE_',
                define: {
                    'process.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_CLERK_PUBLISHABLE_KEY)
                }
            });
            app.use(vite.middlewares);
        } catch (error) {
            console.error(chalk.red('Failed to start Vite dev server:'), error);
        }
    } else {
        if (!existsSync(uiDistPath) || !existsSync(path.join(uiDistPath, 'index.html'))) {
            console.error(chalk.red('UI files not found in:', uiDistPath));
            return;
        }

        console.log(chalk.dim(`Serving UI from: ${uiDistPath}`));
        app.use(express.static(uiDistPath));

        app.get('*', (req, res, next) => {
            if (req.path.startsWith('/api')) return next();
            res.sendFile(path.join(uiDistPath, 'index.html'));
        });
    }
}