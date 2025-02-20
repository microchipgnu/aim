import type { AIMPlugin } from "@aim-sdk/core";

export const getToolsPlugin: AIMPlugin = {
    name: "get",
    version: "0.0.1",
    tags: {
        "tools": {
            render: "tools",
            execute: async function* ({ state }) {
                const tools = state.options.tools
                yield Object.keys(tools || {}).join(',');
            },
        },
    },
}