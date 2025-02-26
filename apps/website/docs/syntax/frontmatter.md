---
title: "Frontmatter"
sidebar_position: 5
---

Frontmatter is a YAML metadata block at the top of the document. It's used to define document-level settings. This field is optional.

```aim
---
title: Example AIM Document
description: "An example of how to build an AIM document"
input:
  - name: userName
    type: string
    description: "The name of the user to greet"
---
```

Here's a list of the available frontmatter fields:

- `title`: The title of the document
- `description`: The description of the document
- `input`: The input of the document
- `output`: The output of the document

### Input

The `input` field is an array of objects. Each object represents an input field.

```aim
input:
  - name: userName
    type: string
    description: "The name of the user to greet"
```

### Output

The `output` field is an array of objects. Each object represents an output field.

```aim
output:
  - name: userName
    type: string
    description: "The name of the user to greet"
```
