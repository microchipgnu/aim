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

Write a JavaScript function that returns the result of this question. Do not log anything. Output just the code and a call to the function.


{% ai #generated_code model="openai/gpt-4o" /%}

<!-- Then we run the code that the LLM wrote: -->

{% $generated_code.result %}

```js {% #eval %}
// We pass code that was generated as a string into \`eval\` which will execute it 
// First we remove any backticks/wrappers around the code
const code = aimVariables.generated_code.result.replaceAll(/\`\`\`javascript/g, "").replaceAll(/\`\`\`js/g, "").replaceAll(/\`\`\`JavaScript/g, "").replaceAll(/\`\`\`JS/g, "").replaceAll(/\`\`\`/g, "");

console.log("vars", code);

return eval(code);
```

The answer is: {% $eval.result %}

<!-- The LLM got the answer right! 🎉 -->