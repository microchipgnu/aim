import { writeFileSync } from "fs";
import { transform } from "markdoc/transform";
import { aim, defaultRuntimeOptions, Tag } from "../../index";
import { html } from "../../markdoc/renderers/html";



// Sample test content
const content = {
    main: `
{% loop #loop count=2 %}
    {% if equals($loop.index, 1) %}
        What is the number the first time? {% $loop.index %}
    {% else /%}
        What is the number the second time? {% $loop.index %}
    {% /if %}
{% /loop %}
`,
    secondary: `
# Hey

hey

`,
calculator: `---
title: Loop
description: Use loops to repeat a block of code multiple times.
input:
    - name: count
      type: number
      description: The number of times to repeat the block
---

Let's do the {% $frontmatter.input.count %} times table. Output just the next number.

{% loop #loop count=$frontmatter.input.count %}

    {% $loop.index %} x {% $frontmatter.input.count %} = {% ai model="openai/gpt-4o-mini" /%}

{% /loop %}
`,
test: `---
title: Loop
description: Use loops to repeat a block of code multiple times.
input:
    - name: count
      type: number
      description: The number of times to repeat the block
---

Let's do the {% $frontmatter.input.count %} times table. 

Output just the next number.

{% loop #loop count=$frontmatter.input.count %}

  {% add($loop.index, 1) %} x {% $frontmatter.input.count %} = {% ai #result model="openai/gpt-4o-mini" /%}

{% /loop %}

Yay, we're done!`,
signEthTransaction: `

Lets sign the transaction. {% sign-eth-transaction /%}

What is the signed transaction?

{% ai model="openai/gpt-4o-mini" /%}

{% if equals(1, 1) %}   

{% loop #loop count=2 %}

This is the loop index: {% $loop.index %}

{% /loop %}

{% else /%}

{% ai model="openai/gpt-4o-mini" /%}

{% /if %}

`,

headsTails: `---
title: "Heads or Tails 🪙"
description: "A coin flip game with conditional responses"
---

We just tossed a coin, was it heads or tails?

The last tosses were heads, heads, tails, heads, tails, heads, heads, heads.

Output 'heads' or 'tails' only. Output heads 

{% ai #flip model="openai/gpt-4o-mini" /%}

<!-- We reference the value of the flip in this if-else block -->

{% if equals($flip.result, "heads") %}

    Heads, I win!

    Should I gloat? Write "yes" or "no" only.

    {% ai #gloat model="openai/gpt-4o-mini" /%}

    GLOAT {% $gloat.result %}

<!-- It's possible to nest container blocks inside other container blocks. In fact you can put all the same things in the body of a container block as you can in a prompt -->

        {% if equals($gloat.result, "yes") %}

            Now, write a gloating song. Output just the song.

            {% ai #song model="openai/gpt-4o-mini" /%}

        {% /if %}

        {% else /%}

            Now, be humble and congratulate the loser on their well played match.

            {% ai #humble model="openai/gpt-4o-mini" /%}

        {% /if %}

        {% if equals($flip.result, "tails") %}

            Tails, you lose! 😏

        {% /if %}

    {% else /%}

    Neither heads nor tails, everyone loses 🤷‍♂️

{% /if %}

{% $flip.result %}
`,
ifElse: `---
title: "If else"
description: "An example of how to use AIM to create a document."
input:
  - name: topic
    type: string
    description: "The topic to write about"
  - name: type
    type: string
    description: "The type of writing to create"
  - name: tone
    type: string
    description: "The emotional tone to use"
---

Write a {% $frontmatter.input.type %} about {% $frontmatter.input.topic %}

{% if equals($frontmatter.input.tone, "happy") %}
Make it full of joy and happiness. 

{% else equals($frontmatter.input.tone, "sad") /%}

generate a sad prompt

{% ai #sad-prompt model="openai/gpt-4o-mini" /%}

{% $sad-prompt.result %}

{% else equals($frontmatter.input.tone, "silly") /%}
Make it full of sadness and despair. 

{% else /%}

It should have the following tone: {% $frontmatter.input.tone %}

{% /if %}

{% ai #output model="openai/gpt-4o-mini" /%}
`,
loopUntil: `

Output a random number between 1 and 100. Output just the number.

{% loop lessThanOrEqual($value.result, 30) #loop %}

    {% ai #value model="openai/gpt-4o" /%}
    
{% /loop %}

Yay, we're done! The number is {% $value.result %} and it took {% $loop.index %} tries.
`,
greeting: `


\`\`\`js {% #example %} 
// The code execution node will execute the given JavaScript code

// For example we can write functions ...
function addNumbers(n1, n2) {
  return n1 + n2;
}

// ... call those functions ...
const sum = addNumbers(1, 1);

// ... log outputs ...
console.log("1 + 1 =", sum);

// ... and even mention values from outside the code
const greeting = \`Hello \${aimVariables.frontmatter.input.name}, you're looking good today 🔥\`;

// If we return a value it'll be included in the prompt
export default greeting;
\`\`\`

The code returned: {% $example.result %}

`,
mathsQuestion: `---
title: "Calculator 🧮"
description: "Using code blocks to solve math problems"
input:
  - name: maths_question
    type: string
    description: "The math question to solve"
---

Here's a maths question:

{% $frontmatter.input.maths_question %}

Write a JavaScript function that returns the result of this question. Do not log anything. Output just the code and a call to the function.

{% ai #generated_code model="openai/gpt-4o" /%}

\`\`\`js {% #eval %}
// We pass code that was generated as a string into \`eval\` which will execute it 
// First we remove any backticks/wrappers around the code
const code = aimVariables.generated_code.result.replaceAll(/\`\`\`javascript/g, "").replaceAll(/\`\`\`js/g, "").replaceAll(/\`\`\`JavaScript/g, "").replaceAll(/\`\`\`JS/g, "").replaceAll(/\`\`\`/g, "");

console.log(code);
return eval(code);
\`\`\`

The answer is: {% $eval.result %}
`,
wikipediaResults: `---
title: "Q&A with Wikipedia 📚"
description: "Using code blocks to query Wikipedia"
input:
  - name: question
    type: string
    description: "The question to answer"
---

<!-- The code block is connected to the web so it can be used to hit external APIs too. This can be very useful in a number of ways. Here we show how it can be used to query for up-to-date information from Wikipedia. -->

Retrieval assisted (RAG) question answering using Wikipedia.
e.g. Try asking "When did OceanGate sink?", "How tall is the tallest penguin species?"

Question: {% $frontmatter.input.question %}

<!-- First we get the language model to generate a search term -->

Let's search Wikipedia to answer this question. What's the best search term to use? Output just the search term.

{% ai #search_term model="openai/gpt-4o-mini" /%}

<!-- This chunk of code will hit Wikipedia's API and extract the top 3 articles -->


\`\`\`js {% #wikipedia_results %}

// Read the term generated by the language model
let input;
try {
    input = aimVariables.search_term.result.trim().replace(/^"+|"+$/g, '');
} catch (error) {
    console.error("Error reading search term:", error);
    return { result: "", error: error.toString() };
}

console.log("Searching for the term", input);

try {
    const maxResults = 3;
    const searchTerm = encodeURIComponent(input.trim());
    const url = \`https://en.wikipedia.org/w/api.php?format=json&action=query&list=search&srsearch=\${searchTerm}&srlimit=\${maxResults}&utf8=&origin=*\`;
    const response = await fetch(url);
    const data = await response.json();

    const fetchExtract = async (title) => {
        console.log("Retrieving", title);
        const extractUrl = \`https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&titles=\${encodeURIComponent(title)}&redirects=1&origin=*\`;
        const extractResponse = await fetch(extractUrl);
        const extractData = await extractResponse.json();
        const pageId = Object.keys(extractData.query.pages)[0];
        const extract = extractData.query.pages[pageId].extract;
        return [title, extract];
    }

    try {
        if (data.query.search.length > 0) {
            console.log("Got some results extracting top", data.query.search.length);
            const extracts = await Promise.all(data.query.search.map(result => fetchExtract(result.title)));
            return { result: extracts, error: null };
        } else {
            return { result: "No results found.", error: null };
        }
    } catch (error) {
        console.error("Error extracting Wikipedia results:", error);
        return { result: "", error: error.toString() };
    }
} catch (error) {
    console.error("Error processing Wikipedia results:", error);
    return { result: "", error: error.toString() };
}
    
\`\`\`
<!-- The code returns the top 3 Wikipedia articles that match the search term -->

## Answer:

Based on the information above give the most helpful answer to the question.

Question: {% $frontmatter.input.question %}

Results: {% debug($wikipedia_results) %}

{% ai #answer model="openai/gpt-4o-mini" /%}

{% $answer.result %}
`,
loop: `

{% loop #loop count=2 %}

This is the loop index: {% $loop.index %}

{% /loop %}
`,
parallel: `

{% parallel #parallel %}

    {% loop #loop1 count=2 %}

        This is the loop index: {% $loop1.index %}

    {% /loop %}

    {% loop #loop2 count=2 %}

        This is the loop index: {% $loop2.index %}

    {% /loop %}

{% /parallel %}
`,
structuredOutputs: `

Create a recipe for chocholate cake

{% ai #output1 model="openai/gpt-4o" structuredOutputs={recipe: "string", ingredients: "string[]", instructions: "string[]"} /%}

# {% $output1.structuredOutputs.recipe %}

# Ingredients:

{% loop #loop1 items=$output1.structuredOutputs.ingredients %}

# {% $loop1.count %}. {% $loop1.item %}

{% /loop %}

`,


};

// Create HTML template
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIM Runtime State Visualizer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/9.10.2/jsoneditor.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/9.10.2/jsoneditor.min.css" rel="stylesheet" type="text/css">
    <style>
        .fade-in {
            animation: fadeIn 0.3s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .tab-btn.active-tab {
            position: relative;
        }
        .tab-btn.active-tab::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 2px;
            background-color: rgb(59, 130, 246);
            transition: all 0.3s ease;
        }
        h1 {
            font-size: 1.5rem;
            font-weight: 600;
            font-size: 10rem;
            color: rgb(30, 41, 59);
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
            margin-top: 0.75rem;
            margin-bottom: 0.75rem;
            line-height: 1.75;
        }
        p {
            display: block;
            padding: 0.5rem 0;
            margin: 0.5rem 0;
            color: #475569;
            line-height: 1.6;
            font-size: 1rem;
        }
        loop {
            display: block;
            padding: 1rem;
            margin: 1rem 0;
            border: 2px solid #e5e7eb;
            border-radius: 0.5rem;
            background-color: #f9fafb;
            position: relative;
        }
        
        loop::before {
            content: '↻';
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            font-size: 1.25rem;
            color: #9ca3af;
            animation: spin 2s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        if {
            display: block;
            padding: 0.75rem;
            margin: 0.5rem 0;
            border: 2px solid #60a5fa;
            border-radius: 0.375rem;
            background-color: #eff6ff;
            position: relative;
        }

        if::before {
            content: '?';
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            width: 1.5rem;
            height: 1.5rem;
            border-radius: 50%;
            background-color: #60a5fa;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }

        if[data-condition="true"] {
            border-color: #22c55e;
            background-color: #f0fdf4;
        }

        if[data-condition="true"]::before {
            content: '✓';
            background-color: #22c55e;
        }

        if[data-condition="false"] {
            border-color: #ef4444;
            background-color: #fef2f2;
            opacity: 0.75;
        }

        if[data-condition="false"]::before {
            content: '✕';
            background-color: #ef4444;
        }
        set {
            display: block;
            padding: 0.75rem;
            margin: 0.5rem 0;
            border-left: 4px solid #60a5fa;
            background-color: #eff6ff;
        }
        ai {
            display: inline-block;
            padding: 0.75rem 1rem;
            margin: 0.5rem 0.25rem;
            border: 1px solid #60a5fa;
            border-radius: 0.375rem;
            background-color: #f0f7ff;
            color: #2563eb;
            font-weight: 500;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
        }
        else {
            display: block;
            padding: 0.75rem;
            margin: 0.5rem 0;
            border: 1px solid #60a5fa;
            border-radius: 0.375rem;
            background-color: #f0f7ff;
            color: #2563eb;
            font-weight: 500;
        }
        ai:hover {
            background-color: #e0f2fe;
            border-color: #3b82f6;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        fence {
            display: none;
        }
        parallel {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            padding: 0.75rem;
            margin: 0.5rem 0;
            border: 1px solid #60a5fa;
            border-radius: 0.375rem;
            background-color: #f0f7ff;
            color: #2563eb;
            font-weight: 500;
        }
        .jsoneditor {
            border: none !important;
        }
        .jsoneditor-menu {
            display: none;
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="max-w-7xl mx-auto p-6">        
        <div class="bg-white shadow-sm rounded-lg">
            <div class="border-b border-gray-200">
                <nav class="flex" aria-label="Tabs">
                    <button class="tab-btn active-tab w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-all duration-200" id="state-tab">
                        State Chain
                    </button>
                    <button class="tab-btn w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-all duration-200" id="data-tab">
                        Events Log
                    </button>
                    <button class="tab-btn w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-all duration-200" id="output-tab">
                        Output
                    </button>
                    <button class="tab-btn w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-all duration-200" id="ast-tab">
                        AST
                    </button>
                    <button class="tab-btn w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-all duration-200" id="content-tab">
                        Raw Content
                    </button>
                    <button class="tab-btn w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-all duration-200" id="html-content-tab">
                        HTML Content
                    </button>
                </nav>
            </div>

            <div class="p-6">
                <div id="state-logs" class="tab-content space-y-6"></div>
                <div id="data-logs" class="tab-content hidden space-y-6"></div>
                <div id="ast-logs" class="tab-content hidden space-y-6"></div>
                <div id="output-logs" class="tab-content hidden space-y-6"></div>
                <div id="content-logs" class="tab-content hidden space-y-6"></div>
                <div id="html-content-logs" class="tab-content hidden space-y-6"></div>
            </div>
        </div>
    </div>

    <script>
        const logs = LOGS_PLACEHOLDER;
        const dataEvents = DATA_EVENTS_PLACEHOLDER;
        const output = OUTPUT_PLACEHOLDER;
        const ast = AST_PLACEHOLDER;
        const rawContent = CONTENT_PLACEHOLDER;
        const htmlContent = HTML_CONTENT_PLACEHOLDER;

        function formatTimestamp(ts) {
            return new Date(ts).toLocaleTimeString('en-US', { 
                hour12: true,
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                fractionalSecondDigits: 3
            });
        }

        function renderDiff(value) {
            if (value === 0) return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">0</span>';
            const className = value > 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800';
            const prefix = value > 0 ? '+' : '';
            return \`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${className}">\${prefix}\${value}</span>\`;
        }

        function renderLogEntry(log, index) {
            return \`
                <div class="bg-white rounded-lg shadow-md p-6 fade-in hover:shadow-lg transition-shadow duration-200">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-gray-500 text-sm font-mono">\${formatTimestamp(log.timestamp)}</div>
                        <div class="text-blue-600 font-semibold px-3 py-1 bg-blue-50 rounded-full">\${log.action}</div>
                    </div>
                    <div class="font-mono text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
                        <div>Hash: <span class="text-blue-600">\${log.hash}</span></div>
                        <div>Previous: <span class="text-purple-600">\${log.previousHash}</span></div>
                    </div>
                    <div class="grid grid-cols-3 gap-4 mb-4">
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <div class="text-sm font-medium text-gray-700 mb-1">Stack</div>
                            \${renderDiff(log.diff.stack)}
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <div class="text-sm font-medium text-gray-700 mb-1">Text Registry</div>
                            \${renderDiff(log.diff.textRegistry)}
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <div class="text-sm font-medium text-gray-700 mb-1">Data</div>
                            \${renderDiff(log.diff.data)}
                        </div>
                    </div>
                    <div class="relative">
                        <button onclick="toggleState(this)" class="text-sm text-blue-600 hover:text-blue-800 mb-2">Show State</button>
                        <div id="jsoneditor-\${index}" style="height: 400px; display: none;"></div>
                    </div>
                </div>
            \`;
        }

        function renderDataEvent(event) {
            const typeColors = {
                start: 'bg-blue-50 text-blue-600',
                finish: 'bg-purple-50 text-purple-600',
                success: 'bg-green-50 text-green-600',
                error: 'bg-red-50 text-red-600',
                log: 'bg-gray-50 text-gray-600',
                data: 'bg-yellow-50 text-yellow-600'
            };

            const levelColors = {
                info: 'text-blue-500',
                success: 'text-green-500',
                error: 'text-red-500',
                debug: 'text-gray-500'
            };

            return \`
                <div class="bg-white rounded-lg shadow-md p-6 fade-in hover:shadow-lg transition-shadow duration-200">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-gray-500 text-sm font-mono">\${formatTimestamp(event.timestamp)}</div>
                        <div class="font-semibold px-3 py-1 rounded-full \${typeColors[event.type] || 'bg-gray-50 text-gray-600'}">\${event.type}</div>
                    </div>
                    <div class="flex items-center gap-2 mb-4">
                        <div class="text-sm \${levelColors[event.level] || 'text-gray-500'}">\${event.level}</div>
                        <div class="text-sm text-gray-700">\${event.message || ''}</div>
                    </div>
                    \${event.stack ? \`
                        <div class="mb-4">
                            <div class="text-sm font-medium text-red-600 mb-2">Stack Trace:</div>
                            <pre class="bg-red-50 p-4 rounded-lg overflow-x-auto text-sm text-red-700">\${event.stack}</pre>
                        </div>
                    \` : ''}
                    \${event.data ? \`
                        <div>
                            <div class="text-sm font-medium text-gray-700 mb-2">Data (\${event.dataType || 'unknown type'}):</div>
                            <pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">\${JSON.stringify(event.data, null, 2)}</pre>
                        </div>
                    \` : ''}
                </div>
            \`;
        }

        function renderAST(ast) {
            return \`
                <div class="bg-white rounded-lg shadow-md p-6 fade-in hover:shadow-lg transition-shadow duration-200">
                    <div class="flex items-center justify-between mb-4">
                        <div class="font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600">AST</div>
                    </div>
                    <div id="ast-editor" style="height: 600px;"></div>
                </div>
            \`;
        }

        function renderContent(content) {
            return \`
                <div class="bg-white rounded-lg shadow-md p-6 fade-in hover:shadow-lg transition-shadow duration-200">
                    <div class="flex items-center justify-between mb-4">
                        <div class="font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600">Raw Content</div>
                    </div>
                    <pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">\${content}</pre>
                </div>
            \`;
        }

        function renderHtmlContent(content) {
            return \`
                <div class="bg-white rounded-lg shadow-md p-6 fade-in hover:shadow-lg transition-shadow duration-200">
                    <div class="flex items-center justify-between mb-4">
                        <div class="font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600">HTML Content</div>
                    </div>
                    \${content}
                </div>
            \`;
        }

        function toggleState(button) {
            const editorContainer = button.nextElementSibling;
            const isHidden = editorContainer.style.display === 'none';
            editorContainer.style.display = isHidden ? 'block' : 'none';
            button.textContent = isHidden ? 'Hide State' : 'Show State';
        }

        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('border-blue-500', 'text-blue-600', 'active-tab');
                btn.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            });
            
            document.getElementById(\`\${tabName}-logs\`).classList.remove('hidden');
            const activeTab = document.getElementById(\`\${tabName}-tab\`);
            activeTab.classList.add('border-blue-500', 'text-blue-600', 'active-tab');
            activeTab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');

            // Update URL with tab parameter
            const url = new URL(window.location);
            url.searchParams.set('tab', tabName);
            window.history.pushState({}, '', url);
        }

        // Add click handlers to tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const tabName = btn.id.replace('-tab', '');
            btn.addEventListener('click', () => showTab(tabName));
        });

        // Initialize editors after DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize state logs
            document.getElementById('state-logs').innerHTML = logs.map(renderLogEntry).join('');
            logs.forEach((log, index) => {
                const container = document.getElementById(\`jsoneditor-\${index}\`);
                if (container) {
                    const editor = new JSONEditor(container, {
                        mode: 'view',
                        modes: ['view', 'form', 'code', 'tree'],
                        navigationBar: false
                    });
                    editor.set(log.state);
                }
            });

            // Initialize data logs
            document.getElementById('data-logs').innerHTML = dataEvents.map(renderDataEvent).join('');
            
            // Initialize output logs
            document.getElementById('output-logs').innerHTML = output;
            
            // Initialize AST view
            document.getElementById('ast-logs').innerHTML = renderAST(ast);
            const astEditor = new JSONEditor(document.getElementById('ast-editor'), {
                mode: 'view',
                modes: ['view', 'form', 'code', 'tree'],
                navigationBar: false
            });
            astEditor.set(ast);

            // Initialize content view
            document.getElementById('content-logs').innerHTML = renderContent(rawContent);
            document.getElementById('html-content-logs').innerHTML = renderHtmlContent(htmlContent);

            // Check URL for tab parameter
            const urlParams = new URLSearchParams(window.location.search);
            const activeTab = urlParams.get('tab') || 'state';
            showTab(activeTab);
        });
    </script>
</body>
</html>
`;

async function main() {
    const dataEvents: any[] = [];
    const abortController = new AbortController();

    // Initialize AIM document
    const doc = aim({
        content: run,
        options: {
            signals: {
                abort: abortController.signal
            },
            events: {
                onStart: (msg: string) => {
                    console.log("🚀 Started:", msg);
                    dataEvents.push({ 
                        type: "start", 
                        message: msg,
                        timestamp: new Date().toISOString(),
                        level: "info"
                    });
                },
                onFinish: (msg: string) => {
                    console.log("✅ Finished:", msg);
                    dataEvents.push({ 
                        type: "finish", 
                        message: msg,
                        timestamp: new Date().toISOString(),
                        level: "info"
                    });
                },
                onSuccess: (msg: string) => {
                    console.log("🎉 Success:", msg);
                    dataEvents.push({ 
                        type: "success", 
                        message: msg,
                        timestamp: new Date().toISOString(),
                        level: "success"
                    });
                },
                onError: (msg: string) => {
                    console.error("❌ Error:", msg);
                    dataEvents.push({ 
                        type: "error", 
                        message: msg,
                        timestamp: new Date().toISOString(),
                        level: "error",
                        stack: new Error().stack
                    });
                },
                onLog: (msg: string) => {
                    console.log("📝 Log:", msg);
                    dataEvents.push({ 
                        type: "log", 
                        message: msg,
                        timestamp: new Date().toISOString(),
                        level: "debug"
                    });
                },
                onData: (data: any) => {
                    console.log("📊 Data:", data);
                    dataEvents.push({ 
                        type: "data", 
                        data,
                        timestamp: new Date().toISOString(),
                        level: "info",
                        dataType: typeof data
                    });
                }
            },
            settings: {
                useScoping: false
            },
            config: {},
            plugins: [
                {
                    plugin: {
                        name: 'sign-eth-transaction',
                        version: '0.0.1',
                        tags: {
                            "sign-eth-transaction": {
                                render: "sign-eth-transaction",
                                execute: async function* ({ node, config, state }) {

                                    const result = "Here's the signed transaction: 0x1234567890d3fsasd";
                                    state.context.methods.addToTextRegistry({ text: result, scope: "global" });
                                    yield result;
                                    yield new Tag("div", { text: result });
                                }
                            }
                        }
                    }
                }
            ]
        }
    });

    // Execute document
    // await doc.execute({
    //     input: {
    //         topic: "The future of AI",
    //         type: "sentence",
    //         tone: "sad",
    //         count: 10,
    //         name: "Micro",
    //         maths_question: "What is 1 + 1?",
    //         question: "What is the capital of France?"
    //     }
    // });

    // Execute document with generator
    let resultCount = 0;
    for await (const result of doc.executeWithGenerator({
        input: {
            topic: "The future of AI",
            type: "sentence", 
            tone: "sad",
            count: 10,
            name: "Micro",
            maths_question: "What is 1 + 1?",
            question: "What is the capital of France?"
        }
    })) {
        console.log("🔄 Generator Result:", result);
        resultCount++;
        if (resultCount >= 2) {
            console.log("🚀 Aborting execution...");
            abortController.abort();
            break;
        }
    }


    

    console.log("🚀 State Manager:", JSON.stringify(doc.stateManager.getRuntimeState().options.config, null, 2));

    // Get state chain logs
    const logs = doc.stateManager.getStateHistory();
    const AST = doc.ast;

    console.log("📋 Data Events:", dataEvents);

    // Generate HTML with logs
    const htmlOutput = dataEvents
        .filter(event => event.type === 'data')
        .map(event => html(event.data))
        .join('');

    console.log("📋 HTML Output:", htmlOutput);

    const renderableContent = await transform(doc.ast, defaultRuntimeOptions.config);
        
    const finalHtml = htmlTemplate
        .replace('LOGS_PLACEHOLDER', JSON.stringify(logs, null, 2))
        .replace('DATA_EVENTS_PLACEHOLDER', JSON.stringify(dataEvents, null, 2))
        .replace('OUTPUT_PLACEHOLDER', JSON.stringify(htmlOutput, null, 2))
        .replace('AST_PLACEHOLDER', JSON.stringify(AST, null, 2))
        .replace('CONTENT_PLACEHOLDER', JSON.stringify(run, null, 2))
        .replace('HTML_CONTENT_PLACEHOLDER', JSON.stringify(html([renderableContent])));

    // Write to file
    writeFileSync('logs.html', finalHtml);
    
    console.log('📄 Logs have been written to logs.html');
    process.exit(0);
}

const run = content.structuredOutputs

main().catch(console.error);

