import { aim } from "index";

const doc = await aim`---
execute: true
---


pick a model from the list [openai/gpt-4o-mini, anthropic/claude-3-5-sonnet-20240620]
. Answer with the model name only.

{% ai #model model="meta-llama/llama-3.2-3b-instruct:free@openrouter" /%}

This is the model: {% $model.result %}
`

console.log(doc.warnings);


console.log(await doc.execute({
    onLog: (message) => console.log(message),
}));

process.exit(0);