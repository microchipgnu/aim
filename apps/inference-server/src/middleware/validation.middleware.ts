import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../types';

export const validateAimRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { content, input } = req.body;

  if (!content) {
    throw new AppError(400, 'Content is required');
  }

  next();
};
