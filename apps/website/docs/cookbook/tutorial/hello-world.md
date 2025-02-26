---
title: "👋🌍 Hello World"
sidebar_position: 1
---

## Hello World Example
```aim
---
title: "Hello World 👋🌍"
description: "By the way, this is the prompt description. Just like the title above and any comments (in gray) below it's there for you and isn't part of the context that's given to the LLM"
input:
  - name: name
    type: string
    description: "The name to greet"
---

<!-- This is a comment. You can use it to annotate parts of the prompt with additional descriptions. We use it extensively in these tutorials to describe what's happening. Comments are not executed in the runtime. -->

Say hello to {% $frontmatter.input.name %}.

{% ai #greeting model="openai/gpt-4o-mini" /%}

```

Now we can extend this example by adding a new input to the frontmatter and using it in the prompt.

## Hello World Example Extension

```aim
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

```