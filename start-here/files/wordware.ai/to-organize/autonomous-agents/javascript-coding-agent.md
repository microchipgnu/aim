---
title: "JavaScript Coding Agent"
description: "A JavaScript coding agent"
input:
  - name: problem
    type: string
    description: "The problem to solve"
---

Write JavaScript code that solves {% $frontmatter.input.problem %}. Return only the code and nothing else. Do not create the dictionary since it has already been assigned. Avoid using libraries that are not in the JavaScript standard libraries. You should provide code in ``` format.

{% loop contains($eval.result, "end") #loopId %}

    {% ai #code model="openai/gpt-4o" /%}

    Now run the code:

    ```js {% #output %}
    // Function to strip off ``` and any surrounding text from the code string using regex
    function stripCodeString(code) {
    const match = code.match(/```[\w]*\n([\s\S]+?)\n```/);
    if (match && match[1]) {
        return match[1];
    }
    throw new Error('Invalid code format');
    }

    // Assume @code is the code string passed to this function
    const rawCode = @code;

    const strippedCode = stripCodeString(rawCode);

    // We pass the stripped code that was generated as a string into `eval` which will execute it 
    // This code block has 'continue on error' enabled so that the agent will keep running if there's an error in the code and try to fix it
    return await eval(strippedCode);
    ```

    Result: {% debug($output) %}

    Given that result and the logs for the execution, did the JavaScript code work and produced valid result? Reply `end` if it did and `retry` if it did not. Do not return anything but that one word answer. Also if the following count is larger than 5 then you must. reply `end`. Count: {% $loopId.count %}

    {% ai #eval model="openai/gpt-4o" /%}

    {% if contains($eval.result, "retry") %}
        Make a change to the code and try again, so that it works next time.
    {% /if %}

{% /loop %}

Final result:

{% $output.code %}