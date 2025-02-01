import type { ConfigFunction } from "@markdoc/markdoc";

export const add: ConfigFunction = {
	parameters: {
		0: { required: true },
		1: { required: true },
	},
	transform(parameters: Record<string, unknown>) {
		const a = Number.parseInt(parameters[0] as string, 10);
		const b = Number.parseInt(parameters[1] as string, 10);
		return a + b;
	},
};

export const subtract: ConfigFunction = {
	parameters: {
		0: { required: true },
		1: { required: true },
	},
	transform(parameters: Record<string, unknown>) {
		const a = Number.parseInt(parameters[0] as string, 10);
		const b = Number.parseInt(parameters[1] as string, 10);
		return a - b;
	},
};

export const multiply: ConfigFunction = {
	parameters: {
		0: { required: true },
		1: { required: true },
	},
	transform(parameters: Record<string, unknown>) {
		const a = Number.parseInt(parameters[0] as string, 10);
		const b = Number.parseInt(parameters[1] as string, 10);
		return a * b;
	},
};

export const divide: ConfigFunction = {
	parameters: {
		0: { required: true },
		1: { required: true },
	},
	transform(parameters: Record<string, unknown>) {
		const a = Number.parseInt(parameters[0] as string, 10);
		const b = Number.parseInt(parameters[1] as string, 10);
		if (b === 0) {
			throw new Error("Division by zero");
		}
		return a / b;
	},
};
