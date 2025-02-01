---
title: Test
description: This is a test
input:
  - name: test
    type: string
---

Say hey to {% $frontmatter.input.test %}

{% ai #hey model="openai/gpt-4o-mini" /%}

# {% $hey.result %}