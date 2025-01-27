---
title: "Hello World 👋🌍"
description: "An example of the extension, **try doing it yourself before peeking!** We add a new 'style' input and tell the model to use that style by referencing that value in the prompt using `$style`."
input:
  - name: name
    type: string
    description: "The name to greet"
  - name: style
    type: string
    description: "The style to use"
---

Say hello to {% $frontmatter.input.name %}.

Use the following style: {% $frontmatter.input.style %}. Do not use any other style. Do not use emojis.

{% ai #greeting model="openai/gpt-4o-mini" /%}

{% $greeting.result %}
