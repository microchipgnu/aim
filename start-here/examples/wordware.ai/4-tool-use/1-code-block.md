---
title: "Code Block Introduction 🤓"
description: "An example of how to use code blocks in AIM"
input:
  - name: name
    type: string
    description: "The name to greet"
---

<!-- Sometimes it helps to run some code e.g.

- Performing maths/executing logic
- Gathering relevant and up-to-date information from an external data source  
- Parsing/formatting
- Leveraging external services as part of an end-to-end program e.g. image generation, speech synthesis, speech-to-text, etc.

Here we give an example 'Hello world' code block with functions, logging and returning values.

Don't worry if you can't code, you probably won't need to write the code yourself. You can either copy code from other Wordware projects or get an LLM to write the code for you! 🤯

You can add a code execution block by typing /code -->

```js {% #example %} 
// The code execution node will execute the given JavaScript code

// For example we can write functions ...
function addNumbers(n1, n2) {
  return n1 + n2;
}

// ... call those functions ...
const sum = addNumbers(1, 1);

// ... log outputs ...
console.log("1 + 1 =", sum);

// ... and even mention values from outside the code
const greeting = `Hello ${aimVariables.frontmatter.input.name}, you're looking good today 🔥`;

// If we return a value it'll be included in the prompt
return greeting;
```

The code returned: {% $example.result %}
