---
title: "Hello World 👋🌍"
description: "By the way, this is the prompt description. Just like the title above and any comments (in gray) below it's there for you and isn't part of the context that's given to the LLM"
input:
  - name: name
    type: string
    description: "The name to greet"
---

<!-- 

This is a comment. You can use it to annotate parts of the prompt with additional descriptions. We use it extensively in these tutorials to describe what's happening.

Since comments aren't included in prompts when they're executed you can also use it to disable certain sections of the prompt without deleting them!

To make a comment simply wrap text in &lt;!-- --&gt; tags.

Ok, let's get started on the prompt itself... 

-->

Say hello to {% $frontmatter.input.name %}.

{% ai #greeting model="openai/gpt-4o-mini" /%}

<!-- ### Explanation

First up we have a little bit of text with a '**mention**'. Mentions are references to values in the 'prompt program', they get replaced by the actual value when the prompt is ran.

You can create mentions by typing 'v[' followed by the variable path you want to reference.

In this case we're referencing the **input** value "name". Inputs are defined in the frontmatter at the top of the file.

Next we have a '**generation**'. This is an output from a language model, we'll be using these a lot!

You can create generations using the ::ai{} syntax with a unique ID and model specification. The generation ID is just there to help you identify and reference the output; it doesn't affect the output from the LLM itself.

-->