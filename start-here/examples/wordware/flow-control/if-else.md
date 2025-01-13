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

Write a {% $frontmatter.input.type %} about {% $frontmatter.input.topic %}

Make it full of joy and happiness. {% if $frontmatter.input.tone == "happy" %}

Make it full of sadness and despair. {% if $frontmatter.input.tone == "sad" %}

Make it full of sadness and despair. {% else %}

Output just the {% $frontmatter.input.type %}

{% ai #output model="openai/gpt-4o-mini" /%}

{% $output.result %}