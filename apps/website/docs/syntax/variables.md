---
title: "Variables"
sidebar_position: 7
---

Variables let you customize your AIM documents at runtime.

```aim
Here I am rendering a custom {% $variable %}
```


###  Scoping

Variables have different scopes:

- **Global**: Defined in frontmatter or top-level set commands.
- **Block**: Limited to the current block and its children.
- **Flow**: Shared between connected flow blocks.

```aim
{% set #globalVar value="Available everywhere" /%}

{% loop #loopVar count=3 /%}
  {% set #loopVar value="Only in loop" /%}
  {% $globalVar %} yields "Available everywhere"
  {% $loopVar %} yields "Only in loop"
{% /loop %}

{% $globalVar %} yields "Available everywhere"
{% $loopVar %} yields `null`
```

### Caveats

AIM doesn't support passing variables to certain [nodes](#nodes), such as the `href` of a `link` Node. Instead, pass your variable to the `href` attribute of a custom `link` [Tag](#tags).

:::danger[Incorrect]

```aim
[Link]({% $variable %})
```

:::

:::tip[Correct]

```aim
{% link href=$myVar %} Link {% /link %}
```

:::
