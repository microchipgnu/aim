import {
  aim,
  defaultRuntimeOptions,
  renderers,
  transform,
} from '@aim-sdk/core';
import { config } from '../config/app.config';
import { AppError } from '../types';
import { abortManager } from './abort.service';

export interface AIMResponse {
  writableEnded: boolean;
  write: (data: string) => void;
  end: () => void;
}

export class AIMManager {
  private readonly defaultOptions = {
    config: defaultRuntimeOptions.config,
    settings: {
      useScoping: config.aim.useScoping,
    },
  };

  constructor() {}

  async getDocumentInfo(content: string) {
    try {
      const aimDocument = aim({
        content,
        options: {
          ...this.defaultOptions,
          signals: {
            abort: new AbortController().signal,
          },
        },
      });

      return {
        frontmatter: aimDocument.frontmatter,
        validation: aimDocument.errors,
      };
    } catch (error) {
      throw new AppError(500, 'Failed to get document info');
    }
  }

  async getDocumentAST(content: string) {
    try {
      const aimDocument = aim({
        content,
        options: {
          ...this.defaultOptions,
          signals: {
            abort: new AbortController().signal,
          },
          events: {
            onLog: (message) => console.log(`Log: ${message}`),
          },
        },
      });

      if (aimDocument.errors.length > 0) {
        console.log(`⚠️  ${aimDocument.errors.length} errors found`);
      }
      if (aimDocument.warnings.length > 0) {
        console.log(`⚠️  ${aimDocument.warnings.length} warnings found`);
      }

      return {
        document: aimDocument.ast,
        rawContent: content,
        rawHtml: renderers.html([
          transform(aimDocument.ast, defaultRuntimeOptions.config),
        ]),
        errors: aimDocument.errors,
        warnings: aimDocument.warnings,
        frontmatter: aimDocument.frontmatter,
      };
    } catch (error) {
      throw new AppError(500, 'Failed to get document AST');
    }
  }

  async executeDocument(
    content: string,
    input: any,
    requestId: string,
    res: AIMResponse,
  ) {
    const abortController = abortManager.create(requestId);

    try {
      const aimDocument = aim({
        content,
        options: {
          ...this.defaultOptions,
          signals: {
            abort: abortController.signal,
          },
          events: {
            onLog: (message) => {
              if (!res.writableEnded) {
                console.log(`Log: ${message}`);
                res.write(
                  `event: log\ndata: ${JSON.stringify({ message, requestId })}\n\n`,
                );
              }
            },
            onError: (error) => {
              if (!res.writableEnded) {
                console.error(error);
                res.write(
                  `event: error\ndata: ${JSON.stringify({ error, requestId })}\n\n`,
                );
              }
            },
            onAbort: (reason) => {
              console.warn('Execution aborted:', reason);
              if (!res.writableEnded) {
                res.write(
                  `event: abort\ndata: ${JSON.stringify({
                    reason: reason || 'Execution aborted by user',
                    requestId,
                  })}\n\n`,
                );
                res.end();
              }
              abortManager.delete(requestId);
            },
            onData: this.createEventHandler('data', res, requestId),
            onUserInput: async (prompt) => {
              console.log(prompt);
              return '';
            },
          },
        },
      });

      for await (const result of aimDocument.executeWithGenerator({ input })) {
        if (abortController.signal.aborted) {
          break;
        }
      }

      if (!res.writableEnded) {
        res.write(
          `event: complete\ndata: ${JSON.stringify({ requestId })}\n\n`,
        );
        res.end();
      }
    } catch (error) {
      if (!res.writableEnded) {
        console.error(`Error executing document:`, error);
        res.write(
          `event: error\ndata: ${JSON.stringify({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to execute document',
            requestId,
          })}\n\n`,
        );
        res.end();
      }
      throw new AppError(500, 'Failed to execute document');
    } finally {
      abortManager.delete(requestId);
    }
  }

  private createEventHandler(
    eventName: string,
    res: AIMResponse,
    requestId: string,
  ) {
    return (data: any) => {
      console.log(data);
      if (!res.writableEnded) {
        res.write(
          `event: ${eventName}\ndata: ${JSON.stringify({ data, requestId })}\n\n`,
        );
      }
    };
  }
}

export const aimManager = new AIMManager();
