import Markdoc from "@markdoc/markdoc";
import { parser } from "./markdoc/parser"
import { process } from "./runtime/process"

const content = `---
title: What's the capital of Portugal?
---

# {% $frontmatter.title %}

{% ai #hey model="openai/gpt-4-mini" /%}

{% $hey.result %}

{% loop count=3 %}
    {% $frontmatter.title %}
{% /loop %}

`

const { ast, validation, config } = await parser(content);
console.log(config);
const { execution, context } = await process(ast, config);

console.log(JSON.stringify(execution, null, 2));

for (const item of execution) {
    console.log(Markdoc.renderers.html(item));
}