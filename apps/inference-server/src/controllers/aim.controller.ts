import type { NextFunction, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { abortManager } from '../services/abort.service';
import { aimManager } from '../services/aim.service';
import { AppError } from '../types';
import { base64ToUnicode } from '../utils/encode-decode';

export const abortRequest = (req: Request, res: Response) => {
  const { requestId } = req.params;

  if (!requestId) {
    throw new AppError(400, 'Request ID is required');
  }

  const wasAborted = abortManager.abort(requestId);

  if (wasAborted) {
    res.status(200).json({ message: `Request ${requestId} aborted` });
  } else {
    console.log(`No active request found for ID: ${requestId}`);
    throw new AppError(404, 'No active request found with this ID');
  }
};

export const getDocumentInfo = async (req: Request, res: Response) => {
  const content = req.query.content;
  if (!content || typeof content !== 'string') {
    throw new AppError(400, 'Content query parameter is required');
  }

  const decodedContent = base64ToUnicode(content);
  const info = await aimManager.getDocumentInfo(decodedContent);
  res.json(info);
};

export const getDocumentAST = async (req: Request, res: Response) => {
  const { content } = req.params;

  if (!content) {
    throw new AppError(400, 'Content is required');
  }

  const decodedContent = base64ToUnicode(content);
  const ast = await aimManager.getDocumentAST(decodedContent);
  res.json(ast);
};

export const getRequestStatus = (req: Request, res: Response) => {
  const { requestId } = req.params;

  if (!requestId) {
    throw new AppError(400, 'Request ID is required');
  }

  const controller = abortManager.get(requestId);

  if (!controller) {
    console.log(`No active request found for ID: ${requestId}`);
    throw new AppError(404, 'No active request found with this ID');
  }

  res.json({
    status: 'processing',
    requestId,
  });
};

export const processAim = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const requestId = nanoid();
    const { content, input } = req.body;

    const sseResponse = {
      writableEnded: false,
      write: (data: string) => res.write(data),
      end: () => {
        res.end();
        sseResponse.writableEnded = true;
      },
    };

    await aimManager.executeDocument(content, input, requestId, sseResponse);
  } catch (error) {
    next(error);
  }
};
