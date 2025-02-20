---
title: "Step by Step"
sidebar_position: 2
---

```aim
---
title: "Step by step"
description: "A step by step example of how to use AIM to create a document."
input:
  - name: question
    type: string
    description: "The math question to be answered"
---

<!-- First we get the model to think through the answer -->

{% $frontmatter.input.question %}

{% ai #thinking model="openai/gpt-4o-mini" /%}

<!-- We're even using a much smaller, faster and cheaper model here; Mistral 7B rather than GPT-3.5. 
Mistral 7B is 7.5x lower cost on output tokens 
(see the [model documentation](https://www.notion.so/wordware/Models-615b76d7498f4e06ae522a329695da74)). -->

{% ai #thought model="openai/gpt-4o-mini" /%}

<!-- Lastly, we extract the final answer -->

This was your thought: {% $thought.result %}

Now output the final number and only the number.

{% ai #answer model="openai/gpt-4o-mini" /%}

{% $answer.result %}

```