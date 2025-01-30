import type { Request } from 'express';

export interface ServerConfig {
    port: number;
    routesDir: string;
    enableUI?: boolean;
}

export interface RequestWithId extends Request {
    requestId?: string;
} 