---
title: "Tags"
sidebar_position: 2
---

Tags are a syntactic extension to the standard Markdown. Similar to React components and HTML elements, tags are composable, and you can customize them with attributes.

```aim
{% tagName #id attribute="value" /%}
```

AIM comes out-of-the-box with 7 built-in tags: `ai`, `media`, `if`, `else`, `loop`, `flow`, `set`, `input`, and `table`.


### AI

Integrate AI inference. 

The `ai` tag accepts the following attributes:

- `model` (required, default: "openai/gpt-4-mini"): The AI model to use, following the [CAIMPS](https://github.com/microchipgnu/caimps) format `provider/model`
- `id` (optional): A unique identifier for referencing the AI response
- `temperature` (optional, default: 0.5): Controls randomness in the model's output. Higher values (e.g., 0.8) make output more random, lower values (e.g., 0.2) make it more focused

The tag will execute the AI inference and store the result, which can be accessed using `{% $id.result %}`. The context from surrounding text is automatically included in the prompt.

#### Example

```aim
{% ai #greetUser model="openai/gpt-4o-mini" /%}
```

### Media

Embed multimedia content like images, videos, and audio files.

The `media` tag accepts the following attributes:

- `type` (required): The type of media - "image", "video", or "audio"
- `src` (required): URL or path to the media file

#### Example

```aim
{% media type="image/jpeg" src="https://example.com/image.jpg" /%}
```

### Loop

Iterate over collections or a specified number of times. The `loop` tag allows you to repeat content either by iterating through an array of items or executing a fixed number of times.

The `loop` tag accepts the following attributes:

- `items` (optional): An array to iterate over
- `count` (optional): Number of times to repeat the content
- `id` (optional): A unique identifier for the loop

Note: Either `items` or `count` must be specified.

Within the loop, you have access to the following variables:
- `index`: Current iteration number (starts at 1)
- `total`: Total number of iterations
- `isFirst`: Boolean indicating if this is the first iteration
- `isLast`: Boolean indicating if this is the last iteration
- `item`: Current item from the items array (when using `items`)

#### Examples

Iterate over an array:

```aim
{% loop #greetUser items=["John", "Jane", "Jim"] /%}
```

Iterate 10 times:

```aim
{% loop #greetUser count=10 /%}
```

### Flow

Reference external AIM flows.

```aim
{% flow #greetUser model="openai/gpt-4o-mini" /%}
```

### If/Else

Dynamically execute content when specific conditions are met using the `{% if %}` and `{% else /%}` tags. AIM uses conditionals with variables and functions.

:::warning

Unlike JavaScript, Markdoc only considers `undefined`, `null`, and `false` as falsey values.

:::

Use the `if` tag to execute content when a condition evaluates to `true`.

```aim
{% if $condition %}
  This content will be executed if the condition is true
  {% else /%}
  This content will be executed if the condition is false
{% /if %}
```

Use the `else` tag to execute alternate content when the `if` condition isn't met. You can use multiple `else` statements, and the final `else` tag triggers when none of the other conditions are met.


```aim
{% if $myFunVar %}
  Only appear if $myFunVar!
  {% else /%}
  This appears if not $myFunVar!
{% /if %}

{% if $myFunVar %}
  Only appear if $myFunVar!
  {% else $otherFunVar /%}
  This appears if not $myFunVar and $otherFunVar!
  {% else /%}
  This appears if not $myFunVar and not $otherFunVar
{% /if %}
```

### Set

Set tags are used to define variables in your document. The set tag is self-closing and requires an ID attribute to identify the variable being set.

You can set different types of variables:

- Objects using the `object` attribute
- Numbers using the `number` attribute  
- Strings using the `string` attribute
- Booleans using the `boolean` attribute
- Arrays using the `array` attribute

```aim
{% set #var object={name: "John", age: 30} boolean=true /%}

Access the name using {% $var.object.name %}
```

### Table

While Markdoc supports CommonMark tables, it also supports a list based syntax that allows for easy injection of rich content, like bulleted lists and code samples.

#### Basic Table

A basic Markdoc table uses list syntax with each row separated by three dashes `---`.

```aim
{% table %}
* Heading 1
* Heading 2
---
* Row 1 Cell 1
* Row 1 Cell 2
---
* Row 2 Cell 1
* Row 2 cell 2
{% /table %}
```

#### Table with rich content

Markdoc tables support rich text, including code samples and lists.

```aim
{% table %}
* Foo
* Bar
* Baz
---
*
  \`\`\`
  puts "Some code here."
  \`\`\`
*
  {% list type="checkmark" %}
  * Bulleted list in table
  * Second item in bulleted list
  {% /list %}
* Text in a table
---
*
  A "loose" list with

  multiple line items
* Test 2
* Test 3
---
* Test 1
* A cell that spans two columns {% colspan=2 %}
{% /table %}
```

#### Table without headings

If you don't need headings, you can omit them.

```aim
{% table %}
---
* foo
* bar
---
* foo
* bar
{% /table %}
```

#### Set column and row spans

You can set the column and row spans of a cell using the `{% colspan=2 %}` and `{% rowspan=2 %}` attributes.

```aim
{% table %}
---
* foo
* bar
---
* foo {% colspan=2 %}
{% /table %}
```

#### Text alignment

You can align text in a cell using the `{% align="left" %}`, `{% align="center" %}`, or `{% align="right" %}` attributes.

```aim
{% table %}
---
* foo {% align="left" %}
* bar {% align="center" %}
* baz {% align="right" %}
---
* foo
* bar
* baz
{% /table %}
```


