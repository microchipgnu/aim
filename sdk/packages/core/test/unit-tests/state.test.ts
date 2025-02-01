import { describe, test, expect } from "bun:test";
import { StateManager } from "../../runtime/state";
import { GLOBAL_SCOPE } from "../../aim";

describe("StateManager", () => {
	test("constructor initializes with correct default state", () => {
		const manager = new StateManager(
			{ variables: {} },
			{
				plugins: [],
				adapters: [],
				variables: {},
				input: {},
				events: {},
				signal: new AbortController().signal,
				settings: {
					useScoping: true,
				},
				config: { variables: {} },
			},
		);

		const context = manager.getRuntimeContext();
		expect(context.stack).toEqual([]);
		expect(context.data).toEqual({});
		expect(context.plugins.size).toBe(0);
		expect(context.adapters.size).toBe(0);
		expect(context.textRegistry).toEqual({});
	});

	test("pushStack adds new frame correctly", () => {
		const manager = new StateManager(
			{ variables: {} },
			{
				plugins: [],
				adapters: [],
				variables: {},
				input: {},
				events: {},
				signal: new AbortController().signal,
				settings: {
					useScoping: true,
				},
				config: { variables: {} },
			},
		);

		manager.pushStack({
			id: "test",
			variables: { foo: "bar" },
			scope: GLOBAL_SCOPE,
		});

		const context = manager.getRuntimeContext();
		expect(context.stack.length).toBe(1);
		expect(context.stack[0]).toEqual({
			id: "test",
			variables: { foo: "bar" },
			scope: GLOBAL_SCOPE,
		});
	});

	test("pushStack updates existing frame with same id and scope", () => {
		const manager = new StateManager(
			{ variables: {} },
			{
				plugins: [],
				adapters: [],
				variables: {},
				input: {},
				events: {},
				signal: new AbortController().signal,
				settings: {
					useScoping: true,
				},
				config: { variables: {} },
			},
		);

		manager.pushStack({
			id: "test",
			variables: { foo: "bar" },
			scope: GLOBAL_SCOPE,
		});

		manager.pushStack({
			id: "test",
			variables: { baz: "qux" },
			scope: GLOBAL_SCOPE,
		});

		const context = manager.getRuntimeContext();
		expect(context.stack.length).toBe(1);
		expect(context.stack[0].variables).toEqual({
			foo: "bar",
			baz: "qux",
		});
	});

	test("popStack removes frames with matching scope", () => {
		const manager = new StateManager(
			{ variables: {} },
			{
				plugins: [],
				adapters: [],
				variables: {},
				input: {},
				events: {},
				signal: new AbortController().signal,
				settings: {
					useScoping: true,
				},
				config: { variables: {} },
			},
		);

		manager.pushStack({
			id: "test1",
			variables: { foo: "bar" },
			scope: GLOBAL_SCOPE,
		});

		manager.pushStack({
			id: "test2",
			variables: { baz: "qux" },
			scope: "local",
		});

		manager.popStack(GLOBAL_SCOPE);

		const context = manager.getRuntimeContext();
		expect(context.stack.length).toBe(1);
		expect(context.stack[0].scope).toBe("local");
	});

	test("setData correctly updates scoped data", () => {
		const manager = new StateManager(
			{ variables: {} },
			{
				plugins: [],
				adapters: [],
				variables: {},
				input: {},
				events: {},
				signal: new AbortController().signal,
				settings: {
					useScoping: true,
				},
				config: { variables: {} },
			},
		);

		manager.setData({ foo: "bar" }, GLOBAL_SCOPE);
		expect(manager.getScopedVariables(GLOBAL_SCOPE)).toEqual({ foo: "bar" });

		manager.setData({ baz: "qux" }, GLOBAL_SCOPE);
		expect(manager.getScopedVariables(GLOBAL_SCOPE)).toEqual({
			foo: "bar",
			baz: "qux",
		});
	});

	test("addToTextRegistry adds text to correct scope", () => {
		const manager = new StateManager(
			{ variables: {} },
			{
				plugins: [],
				adapters: [],
				variables: {},
				input: {},
				events: {},
				signal: new AbortController().signal,
				settings: {
					useScoping: true,
				},
				config: { variables: {} },
			},
		);

		manager.addToTextRegistry("test text", GLOBAL_SCOPE);
		expect(manager.getScopedText(GLOBAL_SCOPE)).toEqual(["test text"]);

		manager.addToTextRegistry("more text", GLOBAL_SCOPE);
		expect(manager.getScopedText(GLOBAL_SCOPE)).toEqual([
			"test text",
			"more text",
		]);
	});

	test("clearTextRegistry removes text from specified scope", () => {
		const manager = new StateManager(
			{ variables: {} },
			{
				plugins: [],
				adapters: [],
				variables: {},
				input: {},
				events: {},
				signal: new AbortController().signal,
				settings: {
					useScoping: true,
				},
				config: { variables: {} },
			},
		);

		manager.addToTextRegistry("test text", GLOBAL_SCOPE);
		manager.addToTextRegistry("local text", "local");

		manager.clearTextRegistry(GLOBAL_SCOPE);
		expect(manager.getScopedText(GLOBAL_SCOPE)).toEqual([]);
		expect(manager.getScopedText("local")).toEqual(["local text"]);
	});
});
