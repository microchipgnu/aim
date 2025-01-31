import type { Express, Request, Response } from 'express';
import { mcpManager } from '../services/mcp-manager';

export const setupMCPController = async (app: Express, routesDir: string) => {
    console.log('[MCP] Setting up MCP controller...');
    try {
        // Initialize MCP manager
        await mcpManager.initialize(routesDir);

        // SSE endpoint for server-to-client streaming
        app.get('/sse', (req: Request, res: Response) => {
            mcpManager.handleSSEConnection(res);
        });

        // Handle client-to-server messages via POST
        app.post('/messages', (req: Request, res: Response): void => {
            console.log('[MCP] Received client message');
            const transport = mcpManager.getSSETransport();
            if (!transport) {
                console.warn('[MCP] No active SSE connection for message handling');
                res.status(400).json({
                    error: 'SSE connection not established', 
                    message: 'Please establish an SSE connection at /sse before sending messages'
                });
                return;
            }

            try {
                console.log('[MCP] Handling message with active SSE transport');
                transport.handlePostMessage(req, res);
            } catch (error) {
                console.error('[MCP] Error handling message:', error);
                res.status(500).json({
                    error: 'Failed to handle message',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

    } catch (error) {
        console.error('[MCP] Error setting up MCP controller:', error);
        throw error;
    }

    console.log('[MCP] MCP controller setup complete');
    return mcpManager.server;
};
