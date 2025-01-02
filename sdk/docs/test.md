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

::ai{#response model="meta-llama/llama-3.2-3b-instruct:free@openrouter"}


hey {{input.message}} $response