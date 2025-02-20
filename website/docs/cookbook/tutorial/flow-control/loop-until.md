---
title: Loop until a condition is met
sidebar_position: 4
---

```aim

---
title: Loop until a condition is met
description: Use loops to repeat a block of code until a condition is met.
input:
    - name: number
      type: number
      description: The number to stop at
---

Output a random number between 1 and 100. Output just the number.

{% loop lessThanOrEqual($value.result, $frontmatter.input.number) #loop %}

    {% ai #value model="openai/gpt-4o" /%}
    
{% /loop %}

Yay, we're done! The number is {% $value.result %} and it took {% $loop.index %} tries.
```