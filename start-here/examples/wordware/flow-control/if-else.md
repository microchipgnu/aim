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

Write a v[input.type] about v[input.topic]

Make it full of joy and happiness. {if="v[input.tone]=='happy'"}

Make it full of sadness and despair. {else-if="v[input.tone]=='sad'"}

Make it full of sadness and despair. { else }

Output just the v[input.type]

::ai{#output model="openai/gpt-4o-mini"}

v[input.type]