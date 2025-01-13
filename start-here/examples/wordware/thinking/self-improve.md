---
title: "Self-improve"
description: "A self-improving example of how to use AIM to create a document."
input:
  - name: topic
    type: string
    description: "The topic to be explained"
---

I'd like you to explain {% $frontmatter.input.topic %} to a 12 year old.

{% ai #thought model="openai/gpt-4o-mini" /%}

{% $thought.result %}

Judge the above explanation on it's correctness, conciseness and understandability for a 12 year old. Suggest some feedback to improve it.

{% ai #feedback model="openai/gpt-4o-mini" /%}

{% $feedback.result %}

Now improve the explanation based on the feedback.

{% ai #improved model="openai/gpt-4o-mini" /%}

{% $improved.result %}
