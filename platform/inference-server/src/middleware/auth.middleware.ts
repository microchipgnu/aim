import type { Request, Response, NextFunction } from 'express';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({ error: 'Authorization header missing' });
        }

        // Verify the API key with the gateway service
        const response = await fetch(`${process.env.GATEWAY_URL}/api/verify`, {
            headers: {
                'Authorization': authHeader || ''
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                res.status(401).json({ error: 'Invalid API key' });
            }
            throw new Error(`Auth request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Attach the verified user ID to the request for use in routes
        req.userId = data.id;

        // Continue to the route handler
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication service unavailable' });
    }
};

// Extend Express Request type to include userId property
declare global {
    namespace Express {
        interface Request {
            userId: string;
        }
    }
}
