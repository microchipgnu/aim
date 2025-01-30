import { aim, defaultRuntimeOptions, renderers, transform } from '@aim-sdk/core';
import { promises as fs } from 'node:fs';
import chalk from 'chalk';
import { abortManager } from './abort-manager';

export interface AIMResponse {
    writableEnded: boolean;
    write: (data: string) => void;
    end: () => void;
}

export class AIMManager {
    constructor() {}

    async getDocumentInfo(content: string) {
        const aimDocument = aim({
            content,
            options: {
                config: defaultRuntimeOptions.config,
                signals: {
                    abort: new AbortController().signal
                },
                settings: {
                    useScoping: false
                }
            }
        });

        return {
            frontmatter: aimDocument.frontmatter,
            validation: aimDocument.errors
        };
    }

    async getDocumentAST(filePath: string) {
        const content = await fs.readFile(filePath, 'utf-8');
        
        const aimDocument = aim({
            content,
            options: {
                signals: {
                    abort: new AbortController().signal
                },
                config: defaultRuntimeOptions.config,
                events: {
                    onLog: (message) => console.log(chalk.dim(`Log: ${message}`))
                },
                settings: {
                    useScoping: false
                }
            }
        });

        if (aimDocument.errors.length > 0) {
            console.log(chalk.red(`⚠️  ${aimDocument.errors.length} errors found in ${filePath}`));
        }
        if (aimDocument.warnings.length > 0) {
            console.log(chalk.yellow(`⚠️  ${aimDocument.warnings.length} warnings found in ${filePath}`));
        }

        return {
            document: aimDocument.ast,
            rawContent: content,
            rawHtml: renderers.html([transform(aimDocument.ast, defaultRuntimeOptions.config)]),
            errors: aimDocument.errors,
            warnings: aimDocument.warnings,
            frontmatter: aimDocument.frontmatter
        };
    }

    async executeDocument(content: string, input: any, requestId: string, res: AIMResponse) {
        const abortController = abortManager.create(requestId);

        const aimDocument = aim({
            content,
            options: {
                signals: {
                    abort: abortController.signal
                },
                events: {
                    onLog: (message) => {
                        if (!res.writableEnded) {
                            console.log(chalk.dim(`Log: ${message}`));
                            res.write(`event: log\ndata: ${JSON.stringify({ message, requestId })}\n\n`);
                        }
                    },
                    onError: (error) => {
                        if (!res.writableEnded) {
                            console.error(error);
                            res.write(`event: error\ndata: ${JSON.stringify({ error, requestId })}\n\n`);
                        }
                    },
                    onAbort: (reason) => {
                        console.warn('Execution aborted:', reason);
                        if (!res.writableEnded) {
                            res.write(`event: abort\ndata: ${JSON.stringify({ 
                                reason: reason || 'Execution aborted by user',
                                requestId
                            })}\n\n`);
                            res.end();
                        }
                        abortManager.delete(requestId);
                    },
                    onSuccess: this.createEventHandler('success', res, requestId),
                    onFinish: this.createEventHandler('finish', res, requestId),
                    onStart: this.createEventHandler('start', res, requestId),
                    onStep: this.createEventHandler('step', res, requestId),
                    onData: this.createEventHandler('data', res, requestId),
                    onOutput: async (output) => {
                        console.log(output);
                        if (!res.writableEnded) {
                            res.write(`event: output\ndata: ${JSON.stringify({ output, requestId })}\n\n`);
                        }
                    },
                    onUserInput: async (prompt) => {
                        console.log(prompt);
                        return "";
                    }
                },
                config: defaultRuntimeOptions.config,
                settings: {
                    useScoping: false
                }
            }
        });

        try {
            for await (const result of aimDocument.executeWithGenerator({ input })) {
                if (abortController.signal.aborted) {
                    break;
                }
                // if (result && typeof result === 'object') {
                //     res.write(`event: data\ndata: ${JSON.stringify({ data: result, requestId })}\n\n`);
                // }
            }

            if (!res.writableEnded) {
                res.write(`event: complete\ndata: ${JSON.stringify({ requestId })}\n\n`);
                res.end();
            }
        } catch (error) {
            if (!res.writableEnded) {
                console.error(chalk.red(`Error executing document:`), error);
                res.write(`event: error\ndata: ${JSON.stringify({
                    error: error instanceof Error ? error.message : 'Failed to execute document',
                    requestId
                })}\n\n`);
                res.end();
            }
        } finally {
            abortManager.delete(requestId);
        }
    }

    private createEventHandler(eventName: string, res: AIMResponse, requestId: string) {
        return (data: any) => {
            console.log(data);
            if (!res.writableEnded) {
                res.write(`event: ${eventName}\ndata: ${JSON.stringify({ data, requestId })}\n\n`);
            }
        };
    }
}

export const aimManager = new AIMManager();
