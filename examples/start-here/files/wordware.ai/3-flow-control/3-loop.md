---
title: Loop
description: Use loops to repeat a block of code multiple times.
input:
    - name: count
      type: number
      description: The number of times to repeat the block
---

Let's do the {% $frontmatter.input.count %} times table. 

Output just the next number.

{% loop #loop count=$frontmatter.input.count %}

  {% add($loop.index, 1) %} x {% $frontmatter.input.count %} = {% ai #result model="openai/gpt-4o-mini" /%}

{% /loop %}

Yay, we're done!