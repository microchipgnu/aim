import { aim, defaultRuntimeOptions, renderers, transform, type RenderableTreeNode, } from '@aim-sdk/core';
import chalk from 'chalk';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import { getHtmlOutput } from '../pages/output';
import type { RouteInfo } from '../resolution';
import { abortManager } from './abort-manager';

export interface AIMResponse {
    writableEnded: boolean;
    write: (data: string) => void;
    end: () => void;
}

export class AIMManager {
    routes: RouteInfo[]
    tools: any[]
    env: any
    plugins: any[]

    constructor(routes?: RouteInfo[], tools?: any, env?: any, plugins?: any) {
        this.routes = routes || [];
        this.tools = tools || [];
        this.env = env || {};
        this.plugins = plugins || [];
    }

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
                tools: this.tools as any,
                env: this.env,
                plugins: this.plugins,
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

    async executeDocument(content: string, input: any, requestId: string, res?: AIMResponse, local: boolean = false) {
        console.log(chalk.cyan(`🚀 Starting execution [${requestId}]`));
        const abortController = abortManager.create(requestId);

        const isLocal = local;

        if (!isLocal && res !== undefined) {
            try {
                let output = '';
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

                const spinner = ora('Receiving chunks...').start();

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
                                    // console.log(chalk.dim(`📋 ${data.message}`));
                                } else if (data.data) {
                                    // console.log(chalk.green(`✨ Result received:`));
                                    const rendered = renderers.html(data.data)

                                    output += rendered;
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

                const html = getHtmlOutput('Execution Results', output);

                // Store the output HTML file
                const outputPath = path.join(process.cwd(), 'output', `${requestId}.html`);
                await fs.mkdir(path.dirname(outputPath), { recursive: true });
                await fs.writeFile(outputPath, html);

                spinner.succeed(`\n✅ Execution completed [${requestId}]\n`);

                const outputUrl = `file://${outputPath}`;
                console.log(chalk.dim(`📄 Output saved to: ${outputUrl}`));
                const { exec } = require('child_process');
                const command = process.platform === 'win32'
                    ? `start ${outputUrl}`
                    : process.platform === 'darwin'
                        ? `open ${outputUrl}`
                        : `xdg-open ${outputUrl}`;
                exec(command);

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
        } else {
            await this.executeDocumentLocally(content, input, requestId, res);
        }
    }

    async executeDocumentLocally(content: string, input: any, requestId: string, res?: AIMResponse) {

        const files = Object.fromEntries(
            this.routes.map(route => [
                route.file,
                { content: route.content }
            ])
        )

        const aimDocument = aim({
            content,
            options: {
                ...defaultRuntimeOptions,
                experimental_files: files,
                tools: this.tools as any,
                env: this.env,
                plugins: this.plugins
            }
        });

        const spinner = ora(chalk.cyan('Executing document...')).start();

        let output = ""
        for await (const result of aimDocument.executeWithGenerator({ input })) {
            output += renderers.html(result as RenderableTreeNode[])
            spinner.text = `Executing document... Received: ${JSON.stringify(result).length} characters at ${new Date().toISOString()}`;
        }
        spinner.succeed('Document executed successfully');
        const html = getHtmlOutput('Execution Results', output);

        // Store the output HTML file
        const outputPath = path.join(process.cwd(), 'output', `${requestId}.html`);
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, html);

        const outputUrl = `file://${outputPath}`;
        console.log(chalk.green(`✅ Output saved to: ${outputUrl}`));
        return { outputUrl };
    }

    async getInputSchema(content: string) {
        const aimDocument = aim({
            content,
            options: defaultRuntimeOptions
        });
        return aimDocument.frontmatter?.input;
    }
}

export const aimManager = new AIMManager();
