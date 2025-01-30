import type { ErrorRequestHandler } from 'express';
import chalk from 'chalk';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error(chalk.red('Server error:'), err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};