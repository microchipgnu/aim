---
title: "Hello World 👋🌍"
description: "An example of the extension, **try doing it yourself before peeking!** We add a new 'style' input and tell the model to use that style by referencing that value in the prompt using `$style`.
input:
    name: string
    style: string
---

Say hello to $name.
Use the following style: $style.

::ai{#greeting model="openai/gpt-4o-mini"}

