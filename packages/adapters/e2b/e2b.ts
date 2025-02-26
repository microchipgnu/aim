import { quickJS } from "@sebastianwessel/quickjs";

const defaultModules = {
	"load-vars": {
		"index.js": `
            const aimVariables = JSON.parse(env.__AIM_VARIABLES__ || '{}');
            export { aimVariables };
        `,
	},
	"eval-code": {
		"index.js": `
            export function evaluate(code) {
                try {
                    return eval(code);
                } catch (error) {
                    return { error: error.message };
                }
            }
        `,
	},
};

export const runQuickJS = async ({
	env,
	modules: customModules,
}: {
	env?: Record<string, string>;
	modules?: Record<string, Record<string, string>>;
}) => {
	const { createRuntime } = await quickJS();
	const { evalCode } = await createRuntime({
		transformTypescript: true,
		allowFetch: true,
		allowFs: false, // Disable file system access for security
		env: env || {}, // Ensure env is never undefined
		executionTimeout: 10000, // Reduce timeout to 5 seconds
		nodeModules: {
			...defaultModules,
			...(customModules || {}),
		},
	});
	return {
		evalCode,
	};
};
