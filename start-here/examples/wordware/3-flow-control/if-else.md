---
title: "If else"
description: "An example of how to use AIM to create a document."
input:
  - name: topic
    type: string
    description: "The topic to write about"
  - name: type
    type: string
    description: "The type of writing to create"
  - name: tone
    type: string
    description: "The emotional tone to use"
---

<!-- 
We can use if-else statements to conditionally run parts of the prompt. When the prompt is ran only the matching block will be included.

If blocks can compare values in the following ways:

*   **Match** — does the first value equal the 2nd value
    
*   **Contains** — does the search value appear in the input
    
*   **Relative** — how does the 1st value compare to the 2nd value based on the chosen comparison
    

If the if expression evaluates to true that block will be included. If no if expressions match the 'else' block will be ran instead. 
-->

Write a {% $frontmatter.input.type %} about {% $frontmatter.input.topic %}

{% if equals($frontmatter.input.tone, "happy") %}
Make it full of joy and happiness. 

{% else equals($frontmatter.input.tone, "sad") /%}

generate a sad prompt

{% ai #sad-prompt model="openai/gpt-4o-mini" /%}

{% $sad-prompt.result %}

{% else equals($frontmatter.input.tone, "silly") /%}
Make it full of sadness and despair. 

{% else /%}

It should have the following tone: {% $frontmatter.input.tone %}

{% /if %}

{% ai #output model="openai/gpt-4o-mini" /%}

{% $output.result %}