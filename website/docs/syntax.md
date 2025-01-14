---
sidebar_position: 3
title: Syntax
---

AIM syntax is a superset of Markdown, specifically the [CommonMark specification](https://commonmark.org/). AIM adds a few extensions to the syntax, such as tags and annotations (following [Markdoc syntax](https://markdoc.dev/docs/syntax)). 

For a formal gramar of the Markdoc tag syntax, refer to the [Markdoc syntax specification](https://markdoc.dev/spec).

An AIM document consists of:

- [**Frontmatter**](#frontmatter): YAML metadata defining document-level settings.
- [**Nodes**](#nodes): Standard Markdown (specifically the [CommonMark specification](https://commonmark.org/)) treated as content within commands. 
- [**Tags**](#tags): As defined in the [Markdoc syntax specification](https://markdoc.dev/spec).
- [**Variables**](#variables): Prefixed with `$` and allow you to reference the result of a command.
- [**Functions**](#functions): Look and feel similar to JavaScript functions. They're callable from the body of the document, inside an annotation, or within tag attributes. Functions are comma-separated. Trailing commas are not supported in function calls.
- [**Comments**](#comments): AIM supports [Markdown comment syntax](https://spec.commonmark.org/0.30/#example-624). Adding comments will not be rendered in the output nor executed in runtime.

**Example**

```aim
---
title: Example AIM Document
description: "An example of how to build an AIM document"
input:
  - name: userName
    type: string
    description: "The name of the user to greet"
---

# Welcome to AIM

Hello, {% $userName %}!

{% ai #greetUser model="openai/gpt-4o-mini" /%}

{% $greetUser.result %}

<!-- This is a comment -->

```

## Nodes

Nodes are elements that AIM inherits from Markdown, specifically the [CommonMark specification](https://commonmark.org/). AIM nodes enable you to customize how your document executes without using any custom syntax—it consists entirely of Markdown.

AIM comes out of the box with built-in nodes for each of the [CommonMark specification](https://commonmark.org/) types.

Here's a list of the built-in nodes: `document`, `heading`, `paragraph`, `hr`, `image`, `fence`, `blockquote`, `list`, `item`, `table`, `thead`, `tbody`, `tr`, `td`, `th`, `inline`, `strong`, `em`, `s`, `link`, `code`, `text`, `hardbreak`, `softbreak`, `error`.

## Tags

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

## Variables

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

## Functions

Functions are callable from the body of the document, inside an annotation, or within tag attributes.

Functions are comma-separated. Trailing commas are not supported in function calls.

```aim
{% functionName(arg1, arg2) %}
```

AIM comes out-of-the-box with six built-in functions: `equals`, `and`, `or`, `not`, `default`, and `debug`.

- **equals**: Compares two values and returns `true` if they are equal, otherwise `false`.

- **default**: Returns the second parameter if the first parameter is `undefined`
- **debug**: Serializes the value as JSON and logs it to the console.

### And/Or/Not
Use these logical operators to create complex conditional logic within `if` tags:

- **and**: Returns `true` only when both arguments evaluate to `true`. For example, `and($isAdmin, $hasPermission)` ensures both conditions are met.
- **or**: Returns `true` when at least one argument is `true`. For example, `or($isLoggedIn, $isGuest)` allows either condition to pass.
- **not**: Inverts a boolean value - returns `false` for `true` inputs and vice versa. Useful for checking if something is absent, like `not($isBlocked)`.

These functions can be combined for more sophisticated conditions. For example:
`and(not($isBlocked), or($isAdmin, $hasPermission))` checks that a user isn't blocked AND is either an admin OR has permission.

```aim
This is always shown
{% if and(not($a), or($b, $c)) %}
This is shown only if $a is falsy and either $b or $c is true.
{% /if %}
```

### Equals

Use this function to compare two values.

```aim
{% if equals($a, $b) %}
  $a and $b are equal
{% /if %}
```

### Default

This function is useful to set a value for a variable that might not exist.

```aim
{% if default($showPrompt, true) %}
Hey there!
{% /if %}
```

### Debug

This function simply renders the value as a serialized JSON value in the document. This can be useful for determining what value is in a variable.

```aim
{% debug($myVar) %}
```

## Attributes 

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


## Frontmatter

Frontmatter is a YAML metadata block at the top of the document. It's used to define document-level settings. This field is optional.

```aim
---
title: Example AIM Document
author: Jane Doe
date: 2024-11-28
---
```