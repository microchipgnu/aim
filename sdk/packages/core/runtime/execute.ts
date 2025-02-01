import * as jsEnvironment from "browser-or-node";
import { process as runtimeProcess } from "./process";
import type { AIMRuntime } from "../types";

async function handleAbortError(error: unknown, stateManager: any) {
	const isAbortError =
		(jsEnvironment.isBrowser &&
			error instanceof DOMException &&
			error.name === "AbortError") ||
		(jsEnvironment.isNode &&
			error instanceof Error &&
			error.name === "AbortError");

	if (isAbortError) {
		stateManager.runtimeOptions.events?.onAbort?.("Execution aborted!");
	} else {
		stateManager.runtimeOptions.events?.onError?.(`Execution error: ${error}`);
	}
	throw error;
}

async function checkAbortSignal(signal: AbortSignal) {
	if (signal.aborted) {
		throw new Error("Execution aborted");
	}
}

async function* processResults({
	node,
	stateManager,
	signal,
}: AIMRuntime & { signal: AbortSignal }) {
	const generator = runtimeProcess({ node, stateManager });

	for await (const result of generator) {
		await checkAbortSignal(signal);

		if (result) {
			stateManager.runtimeOptions.events?.onLog?.(
				`Processing result: ${JSON.stringify(result)}`,
			);
			stateManager.runtimeOptions.events?.onData?.(result);

			if (typeof result === "string" || typeof result === "object") {
				yield result;
			}
		}
	}
}

export const execute = async ({
	node,
	stateManager,
}: AIMRuntime): Promise<void> => {
	const runtimeState = stateManager.getRuntimeState();
	const signal = runtimeState.options.signals.abort;
	const options = runtimeState.options;
	options.variables = options.variables || {};

	await checkAbortSignal(signal);
	stateManager.runtimeOptions?.events?.onStart?.("Execution started!");

	const results: (string | object)[] = [];

	try {
		for await (const result of processResults({ node, stateManager, signal })) {
			results.push(result);
		}

		await checkAbortSignal(signal);
		stateManager.runtimeOptions.events?.onFinish?.("Execution finished!");
		stateManager.runtimeOptions.events?.onSuccess?.(
			"Execution completed successfully!",
		);
	} catch (error) {
		await handleAbortError(error, stateManager);
	}
};

export async function* executeGenerator({
	node,
	stateManager,
}: AIMRuntime): AsyncGenerator<string | object> {
	const runtimeState = stateManager.getRuntimeState();
	const signal = runtimeState.options.signals.abort;
	const options = runtimeState.options;
	options.variables = options.variables || {};

	await checkAbortSignal(signal);
	stateManager.runtimeOptions?.events?.onStart?.("Execution started!");

	try {
		yield* processResults({ node, stateManager, signal });

		await checkAbortSignal(signal);
		stateManager.runtimeOptions.events?.onFinish?.("Execution finished!");
		stateManager.runtimeOptions.events?.onSuccess?.(
			"Execution completed successfully!",
		);
	} catch (error) {
		await handleAbortError(error, stateManager);
	}
}
