import type { Express, Request, Response } from 'express';
import { abortManager } from '../services/abort-manager';
import chalk from 'chalk';

export function setupAbortController(app: Express) {
    app.post('/api/abort/:requestId', (req: Request, res: Response) => {
        const { requestId } = req.params;
        
        if (!requestId) {
            res.status(400).json({ error: 'Request ID is required' });
            return;
        }

        const wasAborted = abortManager.abort(requestId);
        
        if (wasAborted) {
            res.status(200).json({ message: `Request ${requestId} aborted` });
        } else {
            console.log(chalk.yellow(`No active request found for ID: ${requestId}`));
            res.status(404).json({ error: 'No active request found with this ID' });
        }
    });
}