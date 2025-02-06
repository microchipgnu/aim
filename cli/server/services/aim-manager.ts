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
    constructor() { }

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
        console.log(chalk.cyan(`🚀 Starting execution [${requestId}]`));
        const abortController = abortManager.create(requestId);

        try {
            // Set up SSE headers
            res.write('event: start\n');
            res.write(`data: ${JSON.stringify({ requestId })}\n\n`);

            const response = await fetch(`${process.env.INFERENCE_SERVER_URL}/aim/v1/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.INFERENCE_SERVER_API_KEY}`
                },
                body: JSON.stringify({
                    content,
                    input,
                    requestId
                }),
                signal: abortController.signal
            });

            if (!response.ok) {
                const errorMessage = `Inference server error: ${response.status} ${response.statusText}`;
                console.error(chalk.red(`❌ ${errorMessage}`));

                if (!res.writableEnded) {
                    res.write(`event: error\ndata: ${JSON.stringify({
                        error: errorMessage,
                        requestId
                    })}\n\n`);
                    res.end();
                }
                return;
            }

            // Stream the response
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body from inference server');
            }

            console.log(chalk.yellow('\n📥 Receiving chunks...\n'));

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);

                // Parse and display chunk data nicely
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.message) {
                                console.log(chalk.dim(`📋 ${data.message}`));
                            } else if (data.data) {
                                console.log(chalk.green(`✨ Result received:`));
                                console.log(chalk.white(JSON.stringify(data.data, null, 2)));
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }

                // Forward the chunks to the client
                if (!res.writableEnded) {
                    res.write(`event: chunk\ndata: ${chunk}\n\n`);
                }
            }

            if (!res.writableEnded) {
                res.write(`event: complete\ndata: ${JSON.stringify({ requestId })}\n\n`);
                res.end();
            }

            console.log(chalk.green(`\n✅ Execution completed [${requestId}]\n`));

        } catch (error) {
            console.error(chalk.red('❌ Error executing document:'), error);
            if (!res.writableEnded) {
                res.write(`event: error\ndata: ${JSON.stringify({
                    error: error instanceof Error ? error.message : String(error),
                    requestId
                })}\n\n`);
                res.end();
            }
        } finally {
            console.log(chalk.dim(`🧹 Cleaning up abort controller [${requestId}]`));
            abortManager.delete(requestId);
        }
    }
}

export const aimManager = new AIMManager();
