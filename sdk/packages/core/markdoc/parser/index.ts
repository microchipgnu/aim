import Markdoc, { type Config, type Node } from "@markdoc/markdoc";
import { config as defaultConfig } from "../config";
import yaml from 'js-yaml';

const getFrontmatter = (ast: Node) => {
    let frontmatter = {};
    try {
        const parsed = yaml.load(ast.attributes?.frontmatter);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            frontmatter = parsed as Record<string, any>;
        }
    } catch (err) {
        console.error('Error parsing frontmatter:', err);
    }
    return frontmatter;
}

export const parser = async (input: string, config: Config = defaultConfig): Promise<{ ast: Node, validation: any, config: Config, frontmatter: any }> => {
    const tokenizer = new Markdoc.Tokenizer({
        allowComments: true,
        allowIndentation: true,
    });

    const tokens = tokenizer.tokenize(input);
    const ast = Markdoc.parse(tokens);

    const validation = Markdoc.validate(ast, config);
    const frontmatter = getFrontmatter(ast);

    const _config = {
        ...config,
        variables: {
            ...config.variables,
            frontmatter
        }
    }

    return {
        ast,
        validation,
        config: _config,
        frontmatter
    };
};