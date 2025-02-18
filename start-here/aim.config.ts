import { z } from "zod";

export default {
    tools: [
        {
            name: "test-tool",
            description: "This is a test tool",
            parameters: z.object({
                name: z.string(),
            }),
            execute: async (args: { name: string }) => {
                return `Hello, ${args.name}!`;
            },
        }
    ]
}