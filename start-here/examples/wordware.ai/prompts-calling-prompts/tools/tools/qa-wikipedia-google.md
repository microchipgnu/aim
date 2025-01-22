---
title: "Q&A with Wikipedia and Google 🔍"
description: "Answers questions using Wikipedia and Google search"
input:
  - name: question
    type: string
    description: "The question to answer"
---

<!-- This prompt combines Wikipedia and Google search to provide comprehensive answers -->

Question: {% $frontmatter.input.question %}

<!-- First get the language model to generate a search term -->

Let's search for information to answer this question. What's the best search term to use? Output just the search term.

{% ai #search_term model="anthropic/claude-3-haiku" /%}

<!-- Search both Wikipedia and Google using the search term -->

{% flow #wikipedia_results input=$search_term path="file://./wikipedia-search.md" /%}

{% flow #google_results input=$search_term path="file://./google-search.md" /%}

## Answer:

Based on the information from Wikipedia and Google searches above, provide a comprehensive answer to:

{% $frontmatter.input.question %}

{% ai #final_answer model="openai/gpt-3.5-turbo" /%}

{% $final_answer.result %}
