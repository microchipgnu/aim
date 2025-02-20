---
title: "Prompt Chaining Example" 
description: "Demonstrates how to chain multiple LLM prompts together to break down and solve a math problem step by step"
input:
  - name: problem
    type: string
    description: "The math problem to solve"
---

First, let's extract the key numerical information from the problem.

{% ai #extract model="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo" %}
Given the math problem, ONLY extract any relevant numerical information and how it can be used.

Problem: {% $frontmatter.input.problem %}
{% /ai %}

{% $extract.result %}

Now, let's determine the steps needed to solve this problem.

{% ai #steps model="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo" %}
Given the numerical information extracted above, ONLY express the steps you would take to solve the problem.
{% /ai %}

{% $steps.result %}

Finally, let's calculate the answer.

{% ai #solution model="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo" %}
Given the steps outlined above, express the final answer to the problem.
{% /ai %}

{% $solution.result %}
