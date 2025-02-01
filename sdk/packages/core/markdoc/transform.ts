import Markdoc, { type Config, type Node } from "@markdoc/markdoc";

export async function transform(node: Node, config: Config) {
	return await Markdoc.transform(node, config);
}
