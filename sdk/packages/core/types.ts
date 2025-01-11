import type { Config, Schema, Node } from "@markdoc/markdoc";

export type AIMConfig = Config & {
    variables: Record<string, any>;
}

export type AIMTag = Schema & {
    runtime: (node: Node, config: Config, {  executeNode }: { executeNode?: (node: Node) => Promise<any> }) => Promise<any>;
}

export interface RuntimeContext {
    stack: Array<{
        id: string;
        variables: Record<string, any>;
    }>;
    data: Record<string, any>;
}