import chalk from 'chalk';

class AbortManagerService {
    private requestAbortControllers = new Map<string, AbortController>();

    public create(requestId: string): AbortController {
        // Clean up existing controller if present
        this.abort(requestId);
        
        const controller = new AbortController();
        this.requestAbortControllers.set(requestId, controller);
        return controller;
    }

    public get(requestId: string): AbortController | undefined {
        return this.requestAbortControllers.get(requestId);
    }

    public abort(requestId: string): boolean {
        const controller = this.requestAbortControllers.get(requestId);
        if (controller) {
            if (!controller.signal.aborted) {
                controller.abort();
                console.log(chalk.green(`Successfully aborted request ${requestId}`));
            }
            this.requestAbortControllers.delete(requestId);
            return true;
        }
        return false;
    }

    public delete(requestId: string): void {
        this.requestAbortControllers.delete(requestId);
    }
}

export const abortManager = new AbortManagerService();