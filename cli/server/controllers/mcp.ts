import type { Express, Request, Response } from 'express';
import { mcpManager } from '../services/mcp-manager';

export const setupMCPController = async (app: Express, routesDir: string) => {
    try {
        await mcpManager.initialize(routesDir);

        app.get('/sse', (req: Request, res: Response) => {
            mcpManager.handleSSEConnection(res);
        });

        app.post('/messages', (req: Request, res: Response): void => {
            const transport = mcpManager.getSSETransport();
            if (!transport) {
                res.status(400).json({
                    error: 'SSE connection not established',
                    message: 'Please establish an SSE connection at /sse before sending messages'
                });
                return;
            }

            try {
                transport.handlePostMessage(req, res);
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to handle message',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

    } catch (error) {
        throw error;
    }

    return mcpManager.server;
};
