---
title: "Basic ReAct agent 🤖"
sidebar_position: 1
---

```aim
---
title: "Basic ReAct agent 🤖"
description: "An example of how to build a simple ReAct agent"
input:
  - name: question
    type: string
    description: "The question to answer"
---
<!-- 
What is an agent? Generally 'agent' is used to refer to any system that can make decisions autonomously about how to solve a problem. It can be used to describe a lot of things from chatbots that can use tools/perform RAG to highly general agents that attempt to solve any given task such AutoGPT. These highly general agents tend not to perform very well!

At the end of the day agents are a collection of prompts, tools and logic, all things that can be done in Wordware!

Here we've built an agent that will work out how to solve the given task by searching Google, writing code and calling out to APIs. It's based on the [**ReAct**: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) paper.

Have a look through the prompt to see how we combine everything you just learnt from simple generations to looping, branching and tool use. Don't worry if you don't completely understand it right away, agents are an advanced topic which deserves it's whole own set of lessons but do run it and see what happens! -->


# Instructions

<!-- 
We start by giving the agent a set of instructions on how the agent should behave. Most of these instructions have been added through trial and error of seeing the ways in which the agent fails e.g. "Never create your own question" was added **after** we observed the agent sometimes deciding to just ask a new question (often easier) and answer that one instead! -->

Answer the following question as best you can by utilising external tools to search for APIs that can help you then - as you are an expert JavaScript programmer - writing JavaScript code that will be run in the browser to execute those APIs. Since you aren't able to install packages you'll have to call any API's using `fetch`.

If the API requires authentication (e.g. an API key) you shouldn't attempt to use it and should instead look for an alternative API.

If the code throws an error take a look at it and try and correct it. Be sure to correct places where a similar error may occur too, not only the line that's in the error message. You should also search for the documentation if there's an error with a client library.

After running the code you should look at the result and check if code is doing the correct thing. If it is that's fine you can move onto the next thought, if not you need to correct the logic errors and try again.

You should not ever require or suggest that the user completes the task themselves. You should complete the whole task yourself. If you don't have the necessary API key, find a different API.

Never create your own question.

# Tools

<!-- 
Here we describe the tools that the agent can use. We need to give the tool an identifier then clearly describe when the tool should be used and what inputs it should take. -->

You have access to the following tools:

- `googleSearch`: A wrapper around Google Search. Useful for when you need to find information. Input should be a search query.
- `runCode`: Use this to execute JavaScript scripts. Input should be valid and complete JavaScript code. No external variables can be referenced. No packages can be installed. If you really want to see the output of a value, you should print it out with `console.log(...)`. You should never print very long outputs, only summaries.


# Format 

<!-- 
This part of the instruction is all about how the agent should structure it's response. In the ReAct paper this follows a thought-action-input-observation loop that repeats until the problem is solved. -->

Use the following format

Question: the input question you must answer  
Thought: you should always think about what to do in one sentence  
Action: the action to take, should be googleSearch, runCode or done  
Input: the input to the action  
Observation: the result of the action

... (this Thought/Action/Input/Observation can repeat N times)

Final answer:


# Run

Question: {% $frontmatter.input.question %}

{% loop counter=10 %}

Thought: {% ai #thought model="openai/gpt-4" /%}

Action: {% ai #action model="openai/gpt-4" /%}

{% if action == "googleSearch" %}

Input: {% ai #input model="openai/gpt-4" /%}

{% flow #output model="openai/gpt-4" path="file://./tools/google-search.md" /%}

Observation: {% $output.result %}

{% /if %}

{% if action == "runCode" %}

Input: {% ai #code model="openai/gpt-4" /%}


\`\`\`js {#output}

return await eval(v[code])

\`\`\`

<!-- We show the logs from running the code to the model -->

Code ran: {% $output.result %}

{% /if %}

{% if action == "done" %}

<!-- We're done, no need to do anything, this is also checked in the loop parameters so we terminate the loop -->

Done!

{% /if %}

{% if action != "googleSearch" && action != "runCode" && action != "done" %}

<!-- Occasionally the agent will mess up and generate an invalid action, by feeding this back to the model it can self-correct -->

v[action] is not a valid action, should be 'googleSearch', 'runCode' or 'done'

{% /if %}

{% /loop %}

# Final answer: 

<!-- We get the model to output a final answer, this is what we'd show to our user -->

{% $finalAnswer.result %}
```