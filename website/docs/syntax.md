---
sidebar_position: 2
title: Syntax
---

An AIM document consists of:

- **Global Frontmatter**: YAML metadata defining document-level settings.
- **Commands and Components**: Start with `::`. It uses the directive syntax of the [Generic directives/plugins syntax](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444) proposal.
- **Variables**: Prefixed with `$` for both definition and usage.
- **Plain Text**: Standard Markdown treated as content within commands. 

**Example:**

```markdown
---
title: Example AIM Document
author: Jane Doe
date: 2024-11-28
---

# Welcome to AIM

::set{#userName value="Alice"}

Hello, $userName!

::ai{#greetUser model="openai/gpt-4o-mini"}

$greetUser

```

## Commands and Components

Commands are defined using the :: prefix followed by the command name and attributes in curly braces:

```markdown
::commandName{#id value="value"}
```

Core commands include: 

- **set**: Define a variable
- **ai**: Integrate AI inference models
- **media**: Embed multimedia content
- **if**: Conditional logic
- **loop**: Iterate over collections
- **flow**: Reference external AIM flows

## Variables and Substitutions

Variables can be:

1. Defined using the `set` command:

```markdown
::set{#variableName value="value"}
```

2. Referenced in text:

```markdown
Hello, $userName!
```

3. Passed as a variable to a component:

```markdown
::ai{#greetUser model=$model}
```

## Block Structure

Blocks can be:

1. Container Directives: Multi-line blocks with content and commands.

```markdown
:::loop{#counter count=10}
  $counter
:::
```

2. Leaf Directives: Single-line commands.

```markdown
::image{src="path/to/image.jpg" alt="Description"}
```

3. Text Directives: Inline commands.

```markdown
This is a :highlight[highlighted]{color="yellow"} text
```

## Attributes 

Attributes are specified in curly braces and can include:
- ID: Using # prefix. This is used to reference the execution result of the command.
- Values: String literals, numbers, or variable references
- Boolean Flags: Without values
- Expressions: For conditions and computations

Example: 

```markdown
::ai{#generateImage model="openai/dalle-3" temperature=0.7 prompt=$userPrompt enhanced}
```

## Variable Scoping

Variables have different scopes:

- **Global**: Defined in frontmatter or top-level set commands.
- **Block**: Limited to the current block and its children.
- **Flow**: Shared between connected flow blocks.

```markdown
::set{#globalVar value="Available everywhere"}

:::loop{count=3}
::set{#loopVar value="Only in loop"}
$loopVar and $globalVar are both accessible
:::

$globalVar is accessible, but $loopVar is not
```
