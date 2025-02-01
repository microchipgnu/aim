import Markdoc, {
	type Config,
	type Node,
	type ValidateError,
} from "@markdoc/markdoc";
import yaml from "js-yaml";
import type { RuntimeOptions } from "../../types";

const getFrontmatter = (ast: Node) => {
	let frontmatter = {};
	try {
		const parsed = yaml.load(ast.attributes?.frontmatter);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			frontmatter = parsed as Record<string, any>;
		}
	} catch (err) {
		console.error("Error parsing frontmatter:", err);
	}
	return frontmatter;
};

export const parser = (
	input: string,
	options?: Partial<RuntimeOptions>,
): {
	ast: Node;
	validation: ValidateError[];
	config: Config;
	frontmatter: any;
} => {
	const tokenizer = new Markdoc.Tokenizer({
		allowComments: true,
		allowIndentation: true,
	});

	const tokens = tokenizer.tokenize(input);
	const ast = Markdoc.parse(tokens);

	const validation = Markdoc.validate(ast, options?.config);
	const frontmatter = getFrontmatter(ast);

	const _config = {
		...options?.config,
		variables: {
			...options?.config,
			frontmatter,
		},
	};

	return {
		ast,
		validation,
		config: _config,
		frontmatter,
	};
};
