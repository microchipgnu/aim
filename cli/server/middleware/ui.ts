import type { Express } from 'express';
import express from 'express';
import { existsSync } from 'fs';
import path from 'path';
import chalk from 'chalk';

export async function setupUI(app: Express, isDevelopment: boolean, uiDistPath: string) {
    if (isDevelopment) {
        try {
            const { createServer: createViteServer } = await import('vite');
            const vite = await createViteServer({
                root: path.resolve(uiDistPath, '../ui'),
                server: { middlewareMode: true }
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