import type { Express, Request, Response } from 'express';
import { abortManager } from '../services/abort-manager';
import { aimManager } from '../services/aim-manager';
import chalk from 'chalk';
import { nanoid } from 'nanoid';
import { base64ToUnicode } from '../../utils/encode-decode';

export function setupAIMRoutes(app: Express) {
    app.post('/api/process', async (req: Request, res: Response) => {
        const requestId = nanoid();
        const { content, input } = req.body;

        if (!content) {
            res.status(400).json({ error: 'Content is required' });
            return;
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Request-Id', requestId);

        // Create response wrapper for SSE
        const sseResponse = {
            writableEnded: false,
            write: (data: string) => res.write(data),
            end: () => {
                res.end();
                sseResponse.writableEnded = true;
            }
        };

        try {
            // Decode base64 content from client
            const decodedContent = base64ToUnicode(content);
            await aimManager.executeDocument(decodedContent, input, requestId, sseResponse);
        } catch (error) {
            console.error(chalk.red('Error processing AIM request:'), error);
            if (!sseResponse.writableEnded) {
                res.write(`event: error\ndata: ${JSON.stringify({
                    error: 'Failed to process AIM request',
                    requestId
                })}\n\n`);
                res.end();
            }
        }
    });

    app.get('/api/info', async (req: Request, res: Response) => {
        try {
            const content = req.query.content;
            if (!content || typeof content !== 'string') {
                res.status(400).json({ error: 'Content query parameter is required' });
                return;
            }

            // Decode base64 content from client
            const decodedContent = base64ToUnicode(content);
            const info = await aimManager.getDocumentInfo(decodedContent);
            res.json(info);
        } catch (error) {
            console.error(chalk.red('Error getting document info:'), error);
            res.status(500).json({
                error: 'Failed to get document info',
                message: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    });

    app.get('/api/ast/:filePath', async (req: Request, res: Response) => {
        const { filePath } = req.params;

        if (!filePath) {
            res.status(400).json({ error: 'File path is required' });
            return;
        }

        try {
            const ast = await aimManager.getDocumentAST(filePath);
            res.json(ast);
        } catch (error) {
            console.error(chalk.red('Error getting document AST:'), error);
            res.status(500).json({ error: 'Failed to get document AST' });
        }
    });

    app.get('/api/status/:requestId', (req: Request, res: Response) => {
        const { requestId } = req.params;

        if (!requestId) {
            res.status(400).json({ error: 'Request ID is required' });
            return;
        }

        const controller = abortManager.get(requestId);

        if (!controller) {
            console.log(chalk.yellow(`No active request found for ID: ${requestId}`));
            res.status(404).json({ error: 'No active request found with this ID' });
            return;
        }

        res.json({
            status: 'processing',
            requestId
        });
    });
}