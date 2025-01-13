import { aim } from "index";

const doc = await aim`---
execute: true
---
Answer the following question as best you can by utilising external tools to search for APIs that can help you then - as you are an expert JavaScript programmer - writing JavaScript code that will be run in the browser to execute those APIs. Since you aren't able to install packages you'll have to call any API's using "fetch".

If the API requires authentication (e.g. an API key) you shouldn't attempt to use it and should instead look for an alternative API.

If the code throws an error take a look at it and try and correct it. Be sure to correct places where a similar error may occur too, not only the line that's in the error message. You should also search for the documentation if there's an error with a client library.

After running the code you should look at the result and check if code is doing the correct thing. If it is that's fine you can move onto the next thought, if not you need to correct the logic errors and try again.

You should not ever require or suggest that the user completes the task themselves. You should complete the whole task yourself. If you don't have the necessary API key, find a different API.

Never create your own question.

# Tools

You have access to the following tools:

- "googleSearch": A wrapper around Google Search. Useful for when you need to find information. Input should be a search query.
- "runCode": Use this to execute JavaScript scripts. Input should be valid and complete JavaScript code. No external variables can be referenced. No packages can be installed. If you really want to see the output of a value, you should print it out with "console.log(...)". You should never print very long outputs, only summaries.


# Format 


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

{% loop count=10 %}

Thought: {% ai #thought model="openai/gpt-4" /%}

Action: {% ai #action model="openai/gpt-4" /%}

{% if action == "googleSearch" %}

Input: {% ai #input model="openai/gpt-4" /%}

{% flow #output model="openai/gpt-4" path="file://./tools/google-search.md" /%}

Observation: {% $output.result %}

{% /if %}

{% if action == "runCode" %}

Input: {% ai #code model="openai/gpt-4" /%}


\`\`\js {#output}

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
`

console.log(doc.warnings);


console.log(await doc.execute({
    onLog: (message) => console.log(message),
}));

process.exit(0);