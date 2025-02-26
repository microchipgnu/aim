---
title: "Multilingual blog 🌍"
sidebar_position: 1
---

When you're writing a blog post you might want to write it in multiple languages. This example shows how to create two flows that can be used together to write a blog post in multiple languages.

Let's first create a flow that translates text into different languages.

```aim {% title="translate.md" %}
---
title: "Translate 🌍"
description: "Translates the input into the given language"
input:
  - name: input
    type: string
    description: "The text to translate"
  - name: language
    type: string
    description: "The target language"
---

Translate the "{% $frontmatter.input.input %}" into {% $frontmatter.input.language %}:

{% ai #translation model="openai/gpt-4o" /%}

{% $translation.result %}
```

And then we can create a flow that uses this prompt to translate text into different languages.


```aim {% title="multilingual-blog.md" %}
---
title: "Multilingual blog 🌍"
description: "An example of how to use prompts that call other prompts"
input:
  - name: topic
    type: string
    description: "The topic to write about"
---

Write a short blog post about {% $frontmatter.input.topic %}.

{% ai #blog model="openai/gpt-4o" /%}

## French 🇫🇷

{% flow #french input={input: $blog.result, language: "French"} path="translate.md" /%}

## Spanish 🇪🇸

{% flow #spanish input={input: $blog.result, language: "Spanish"} path="translate.md" /%}

## Pirate 🏴‍☠️

{% flow #pirate input={input: $blog.result, language: "Pirate"} path="translate.md" /%}

```