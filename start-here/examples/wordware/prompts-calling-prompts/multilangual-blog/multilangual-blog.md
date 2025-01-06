---
title: "Multilingual blog 🌍"
description: "An example of how to use prompts that call other prompts"
input:
  - name: topic
    type: string
    description: "The topic to write about"
---

<!-- When a prompt calls another prompt it's a bit like one function calling another in software. 

You create sub-prompts that do one thing really well and reuse those throughout your projects.

It's extremely useful when you've got a chain of prompts where each part needs quite different instructions/personas and you don't want all the context from previous generations to be passed in. -->

Write a short blog post about v[input.topic].

::ai{#blog_post model="openai/gpt-3.5-turbo"}

<!-- To create a prompt node type /prompt then select the prompt you want to run in the sidebar and provide the inputs. 
Inputs can be references to variables or literal values.

Here we have created a prompt that will translate an input into the given language. We run it multiple times to get outputs in French, Spanish and Pirate 🏴‍☠️ -->

## French 🇫🇷

<!-- When a prompt is called none of the context from the current prompt is included other than the values passed as inputs -->

::flow{#french input=v[blog_post] language="French" path="file://./translate.md"}

## Spanish 🇪🇸

::flow{#spanish input=v[blog_post] language="Spanish" path="file://./translate.md"}

## Pirate 🏴‍☠️

::flow{#pirate input=v[blog_post] language="Pirate" path="file://./translate.md"}