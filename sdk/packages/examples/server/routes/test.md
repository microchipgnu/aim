---
title: Test
input:
  - name: message
    description: The message to process
    required: true
    schema:
      type: string
  - name: count
    description: Number of items to return
    required: false
    schema:
      type: integer
      default: 10
---

create a prompt to create an image in dali style of a {{input.message}}

::ai{#response model="meta-llama/llama-3.2-3b-instruct:free@openrouter"}

$response

::replicate{#image model="black-forest-labs/flux-schnell"}

$image
