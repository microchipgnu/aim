import { describe, expect, test } from "bun:test";
import { aim } from "../../aim";

describe("aim", () => {
	test("initializes with default options", () => {
		const result = aim({
			content: "# Test",
			options: {
				plugins: [],
				adapters: [],
				variables: {},
				input: {},
				events: {},
				signals: {
					abort: new AbortController().signal,
				},
				settings: {
					useScoping: false,
				},
				config: { variables: {} },
			},
		});

		expect(result.ast).toBeDefined();
		expect(result.frontmatter).toBeDefined();
		expect(result.errors).toEqual([]);
		expect(result.warnings).toEqual([]);
		expect(result.stateManager).toBeDefined();
		expect(result.execute).toBeDefined();
	});

	test("aborts execution when signal is triggered", async () => {
		const abortController = new AbortController();
		const result = aim({
			content: "{% ai %}test{% /ai %}", // Add AI tag that will take time to process
			options: {
				plugins: [],
				adapters: [],
				variables: {},
				input: {},
				events: {},
				signals: {
					abort: abortController.signal,
				},
				settings: {
					useScoping: false,
				},
				config: { variables: {} },
			},
		});

		// Start execution
		const executePromise = result.execute();

		// Trigger abort signal
		abortController.abort();

		// Execution should reject with abort error
		expect(executePromise).rejects.toThrow("Execution aborted");
	});

	test("aborts nested processing when signal is triggered", async () => {
		const abortController = new AbortController();
		const result = aim({
			content: `
                {% parallel %}
                    {% ai %}test 1{% /ai %}
                    {% ai %}test 2{% /ai %}
                {% /parallel %}
            `,
			options: {
				plugins: [],
				adapters: [],
				variables: {},
				input: {},
				events: {},
				signals: {
					abort: abortController.signal,
				},
				settings: {
					useScoping: false,
				},
				config: { variables: {} },
			},
		});

		const executePromise = result.execute();

		// Give a small delay then abort
		setTimeout(() => {
			abortController.abort();
		}, 100);

		expect(executePromise).rejects.toThrow("Execution aborted");
	});
});
