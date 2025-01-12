import { aim } from "index";

const doc = await aim`---
execute: true
---

Hey there!

What's the capital of Portugal?

{% ai #hey model="openai/gpt-4o-mini" /%}

The AI answered this: {% $hey.result %}

What was the question?

{% ai #hey model="openai/gpt-4o-mini" /%}

 {% hey.result %}


`


console.log(await doc.execute({
    onLog: (message) => console.log(message),
}));

process.exit(0);