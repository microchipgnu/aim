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

<!-- This prompt is called from the multilingual blog example to translate text into different languages -->

Translate the "{% $frontmatter.input.input %}" into {% $frontmatter.input.language %}:

{% ai #translation model="openai/gpt-3.5-turbo" /%}

{% $translation.result %}
