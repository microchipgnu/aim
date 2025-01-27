---
title: Test
description: This is a test
input:
  - name: test
    type: string
  - name: file
    type: file
---

Say hey to {% $frontmatter.input.test %}

{% ai #test model="openai/gpt-4o-mini" /%}

{% $test.result %}

Now invent a story about {% $frontmatter.input.test %}

{% ai #test model="openai/gpt-4o-mini" /%}

{% $test.result %}

Now, write a poem about {% $frontmatter.input.test %}

{% ai #test model="openai/gpt-4o-mini" /%}

{% $test.result %}
