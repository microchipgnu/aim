import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }

    // Unexpected errors
    console.error('Unexpected error:', err);
    return res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
};