---
title: "Hello World 👋🌍"
description: "By the way, this is the prompt description. Just like the title above and any comments (in gray) below it's there for you and isn't part of the context that's given to the LLM"
input:
    name: "name"
---

<!-- 

This is a comment. You can use it to annotate parts of the prompt with additional descriptions. We use it extensively in these tutorials to describe what's happening.

Since comments aren't included in prompts when they're executed you can also use it to disable certain sections of the prompt without deleting them!

To make a comment simply type `/comment`, `//` on a new line or `⌘ + /` (`ctrl + /` on Windows).

Ok, let's get started on the prompt itself... 

-->

Say hello to $name.

::ai{#greeting model="openai/gpt-4o-mini"}

<!-- ### Explanation

First up we have a little bit of text with a '**mention**'. Mentions are references to values in the 'prompt program', they get replaced by the actual value when the prompt is ran.

You can create mentions by typing `@` then the name of the variable that you want to reference.

In this case we're referencing the **input** value "name". Inputs can be created with `/input`, by typing `@` followed by a unique name e.g. `@my_new_input` or by clicking the `+` on the right hand side of the inputs bar in the header.

Next we have a '**generation**'. This is an output from a language model, we'll be using these a lot!

You can create generations using `/generation` or typing `[]` with the generation name inside e.g. `[greeting]`. The generation name is just there to help you identify and reference the output; it doesn't affect the output from the LLM itself. You can change parameters of any node by clicking on the node and setting them in the sidebar.

Go ahead, run this prompt! Use the big green **Run** button in the top right corner.  
The shortcut for this is `⌘ + R` (`ctrl + R` on Windows)

### Extension

Change this prompt so that the person is greeted in a particular style e.g. like Shakespeare 🪶 or a pirate 🏴‍☠️. Bonus points if you can make the style be passed in as an input!

You can make different versions of prompts by duplicating them using the three dots menu on the sidebar:

![image.png](https://uvdxvgggjphy9pqb.public.blob.vercel-storage.com/image-idnEfXM9C4hXmq3Tf2x7ITyosXxxvX.png "image.png") 

-->