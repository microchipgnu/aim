import { tool, type CoreTool, type ToolExecutionOptions } from 'ai';
import { StructuredTool } from 'langchain/tools';
import type { AIMTool } from 'types';
import { z } from 'zod';

/**
 * Converts any supported tool type to Vercel AI SDK format
 * @param inputTool The tool to convert (LangChain, AIM, or Vercel AI SDK tool)
 * @returns Vercel AI SDK compatible tool
 */
export function convertToAISDKTool(
    inputTool: StructuredTool | AIMTool | CoreTool
): CoreTool {
    // If it's already a CoreTool, return as-is
    if ('description' in inputTool && 'parameters' in inputTool && 'execute' in inputTool) {
        return inputTool as CoreTool;
    }

    // Handle LangChain tool
    if (inputTool instanceof StructuredTool) {
        const schema = inputTool.schema;
        return tool({
            description: inputTool.description,
            parameters: schema || z.object({
                input: z.string().describe(inputTool.description)
            }),
            execute: async (args: { [key: string]: any }, options: ToolExecutionOptions) => {
                const result = await inputTool.invoke(args);
                return { result };
            }
        });
    }

    // Handle AIM tool
    if ('description' in inputTool && 'parameters' in inputTool && 'execute' in inputTool) {
        const aimTool = inputTool as AIMTool;
        return tool({
            description: aimTool.description,
            parameters: aimTool.parameters,
            execute: async (args: unknown, options: ToolExecutionOptions) => {
                if (!aimTool.execute) {
                    throw new Error('AIM tool is missing execute method');
                }
                const result = await aimTool.execute(args);
                return { result };
            }
        });
    }

    throw new Error('Unsupported tool type');
}