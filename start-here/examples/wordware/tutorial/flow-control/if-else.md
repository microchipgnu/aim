---
title: "If else"
description: "An example of how to use AIM to create a document."
input:
    topic: string
    type: string
    tone: string
---

Write a $type about $topic.

::::if{$tone=="happy"}

Make it full of joy and happiness.

:::elseif{$tone=="sad"}

Make it full of sadness and despair.

:::

:::else

Make it full of sadness and despair.

:::

::::

Output just the $type

::ai{#output model="openai/gpt-4o-mini"}

$output
