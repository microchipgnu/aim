---
title: "Calculator 🧮"
description: "Using code blocks to solve math problems"
input:
  - name: maths_question
    type: string
    description: "The math question to solve"
---

<!-- LLMs are bad at maths but good at code... Let's see how much better they do at maths questions when writing code to solve the problem instead. -->

Here's a maths question:

{% $frontmatter.input.maths_question %}

<!-- Then we tell it to write some code to solve the question: -->

Write the JavaScript code to solve this question. Use comments to explain your reasoning. Log just the final answer. Output just the code.

{% ai #generated_code model="mistral/7b" /%}

<!-- Then we run the code that the LLM wrote: -->

{% $generated_code.result %}

```js
// We pass code that was generated as a string into `eval` which will execute it 
// First we remove any backticks/wrappers around the code
const code = {{ generated_code }}.replaceAll(/\`\`\`javascript/g, "").replaceAll(/\`\`\`js/g, "").replaceAll(/\`\`\`JavaScript/g, "").replaceAll(/\`\`\`JS/g, "").replaceAll(/\`\`\`/g, "");

return eval(code);
```

The answer is: {% $answer.result %}

<!-- The LLM got the answer right! 🎉 -->
