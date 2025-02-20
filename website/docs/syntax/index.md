---
sidebar_position: 2
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

Hello, {% $frontmatter.input.userName %}!

{% ai #greetUser model="openai/gpt-4o-mini" /%}

{% $greetUser.result %}

<!-- This is a comment -->

```



