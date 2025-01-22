import { $stateChain, aim } from "../../index";
import { writeFileSync } from "fs";
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
`
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
        }
        if {
            display: block;
            padding: 0.75rem;
            margin: 0.5rem 0;
            border-left: 4px solid #60a5fa;
            background-color: #eff6ff;
        }
        ai {
            display: inline;
            padding: 0.75rem;
            margin: 0.5rem 0;
            border-left: 4px solid #60a5fa;
            background-color: #eff6ff;
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="max-w-7xl mx-auto p-6">
        <header class="bg-white shadow-sm rounded-lg mb-8 p-6">
            <h1 class="text-3xl font-bold text-gray-900">AIM SDK Logs Visualizer</h1>
            <p class="text-gray-600 mt-2">Real-time visualization of runtime state and events</p>
        </header>
        
        <div class="bg-white shadow-sm rounded-lg">
            <div class="border-b border-gray-200">
                <nav class="flex" aria-label="Tabs">
                    <button onclick="showTab('state')" class="tab-btn active-tab w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-all duration-200" id="state-tab">
                        State Chain
                    </button>
                    <button onclick="showTab('data')" class="tab-btn w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-all duration-200" id="data-tab">
                        Events Log
                    </button>
                    <button onclick="showTab('output')" class="tab-btn w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-all duration-200" id="output-tab">
                        Output
                    </button>
                </nav>
            </div>

            <div class="p-6">
                <div id="state-logs" class="tab-content space-y-6"></div>
                <div id="data-logs" class="tab-content hidden space-y-6"></div>
                <div id="output-logs" class="tab-content hidden space-y-6"></div>
            </div>
        </div>
    </div>

    <script>
        const logs = LOGS_PLACEHOLDER;
        const dataEvents = DATA_EVENTS_PLACEHOLDER;
        const output = OUTPUT_PLACEHOLDER;

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

        function renderLogEntry(log) {
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
                        <button onclick="toggleState(this)" class="text-sm text-blue-600 hover:text-blue-800 mb-2">Toggle State</button>
                        <pre class="hidden bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">\${JSON.stringify(log.state, null, 2)}</pre>
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

        function toggleState(button) {
            const pre = button.nextElementSibling;
            pre.classList.toggle('hidden');
            button.textContent = pre.classList.contains('hidden') ? 'Toggle State' : 'Hide State';
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
        }

        document.getElementById('state-logs').innerHTML = logs.map(renderLogEntry).join('');
        document.getElementById('data-logs').innerHTML = dataEvents.map(renderDataEvent).join('');
        document.getElementById('output-logs').innerHTML = output;
        
        // Initialize first tab
        showTab('state');
    </script>
</body>
</html>
`;

async function main() {
    const dataEvents: any[] = [];

    // Initialize AIM document
    const doc = aim({
        content: content.calculator,
        options: {
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
            signal: new AbortController().signal,
            settings: {
                useScoping: false
            },
            config: {},
            plugins: []
        }
    });

    // Execute document
    await doc.execute({
        input: {
            count: 2
        }
    });

    // Get state chain logs
    const logs = $stateChain.getState();

    console.log("📋 Data Events:", dataEvents);

    // Generate HTML with logs
    const htmlOutput = dataEvents
        .filter(event => event.type === 'data')
        .map(event => html(event.data))
        .join('');

    console.log("📋 HTML Output:", htmlOutput);
        
    const finalHtml = htmlTemplate
        .replace('LOGS_PLACEHOLDER', JSON.stringify(logs, null, 2))
        .replace('DATA_EVENTS_PLACEHOLDER', JSON.stringify(dataEvents, null, 2))
        .replace('OUTPUT_PLACEHOLDER', JSON.stringify(htmlOutput, null, 2));

    // Write to file
    writeFileSync('logs.html', finalHtml);
    
    console.log('📄 Logs have been written to logs.html');
    process.exit(0);
}

main().catch(console.error);
