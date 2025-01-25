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
                signal: new AbortController().signal,
                settings: {
                    useScoping: false
                },
                config: { variables: {} }
            }
        });

        expect(result.ast).toBeDefined();
        expect(result.frontmatter).toBeDefined();
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
        expect(result.stateManager).toBeDefined();
        expect(result.execute).toBeDefined();
    });
});
