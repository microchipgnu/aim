---
title: "Attributes"
sidebar_position: 3
---

Attributes let you pass data to AIM tags, similar to HTML attributes or React props.

You can pass values of type: `number`, `string`, `boolean`, JSON `array`, or JSON `object` either directly or using variables. With a tag, you can use HTML-like syntax.

```aim

{% ai
  #greetUser
  model="openai/gpt-4o-mini"
  temperature=0.7
/%}

```

To pass attributes to a node, you can't use the HTML-like syntax. Instead, use *annotation* syntax. Put the attributes after the node, in their own set of curly braces (`{%` and `%}`).

```aim
{% table %}

- Function {% width="25%" %}
- Returns  {% colspan=2 %}
- Example  {% align=$side %}

{% /table %}
```

(Annotation syntax also works with tags. But it's required with nodes.)

Strings within attributes must be double-quoted. If you want to include a literal double-quote in a string, you can escape it with using \".

```aim
{% data delimited="\"" /%}
```

### Attribute shorthand

In either syntax, you can use `.my-class-name` and `#my-id` as shorthand for `class="my-class-name"` and `id="my-id"`.

```aim
{% ai #greetUser .my-class-name model="openai/gpt-4o-mini"  /%}
```

