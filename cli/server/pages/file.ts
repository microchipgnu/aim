export function getFilePage(apiPath: string, content: string, markdownContent: string, frontmatter: Record<string, any>) {
    const inputSchema = frontmatter?.input;
    return `
    <!DOCTYPE html>
    <html>
        <head>
            <title>AIM Document - ${apiPath}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://unpkg.com/prismjs@1.29.0/themes/prism-tomorrow.css" rel="stylesheet" />
            <script src="https://unpkg.com/prismjs@1.29.0/components/prism-core.min.js"></script>
            <script src="https://unpkg.com/prismjs@1.29.0/components/prism-markup.min.js"></script>
            <script src="https://unpkg.com/prismjs@1.29.0/components/prism-yaml.min.js"></script>
            <script src="https://unpkg.com/prismjs@1.29.0/components/prism-markdown.min.js"></script>
            <style>
                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    align-items: center;
                    justify-content: center;
                }
                .modal.show {
                    display: flex;
                }
                .modal-content {
                    background-color: white;
                    padding: 2rem;
                    border-radius: 0.5rem;
                    width: 100%;
                    max-width: 32rem;
                    margin: 1rem;
                }
                pre[class*="language-"] {
                    margin: 0;
                    padding: 1em;
                    overflow: auto;
                    background: #2d2d2d;
                    border-radius: 0.5em;
                }
                code[class*="language-"] {
                    color: #ccc;
                    background: none;
                    font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
                    text-align: left;
                    white-space: pre;
                    word-spacing: normal;
                    word-break: normal;
                    word-wrap: normal;
                    line-height: 1.5;
                    tab-size: 4;
                    hyphens: none;
                }
            </style>
        </head>
        <body class="font-sans max-w-4xl mx-auto p-8">
            <div class="flex items-center justify-between pb-2 border-b-2 border-gray-200">
                <h1 class="text-3xl font-bold text-blue-600">/${apiPath}</h1>
                <button 
                    id="runBtn"
                    class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                    onclick="runDocument()"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                    </svg>
                    Run Document
                </button>
            </div>
            
            <div class="mt-6">
                <div class="bg-gray-900 rounded-lg p-6">
                    <pre><code class="language-aim">${markdownContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                </div>
            </div>

            <div id="runModal" class="modal">
                <div class="modal-content">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-semibold">Run Document</h2>
                        <button onclick="closeRunModal()" class="text-gray-500 hover:text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div id="loading" class="hidden flex flex-col items-center justify-center py-4">
                        <div class="loading mb-4"><div></div></div>
                        <span class="text-gray-700 text-lg font-medium">Processing Document</span>
                        <span class="text-gray-500 text-sm mt-2">This may take a few moments...</span>
                    </div>

                    <div id="inputForm" class="space-y-4">
                        ${inputSchema ? inputSchema.map((field: any) => `
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">${field.name}</label>
                                <input 
                                    type="text" 
                                    name="${field.name}"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                >
                            </div>
                        `).join('') : ''}
                        <div class="flex justify-end space-x-2 mt-4">
                            <button 
                                type="button"
                                onclick="closeRunModal()"
                                class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onclick="submitRun()"
                                class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                Run
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <script>
                const inputSchema = ${JSON.stringify(inputSchema)};

                // Configure Prism for AIM language
                Prism.languages.aim = {
                    'comment': {
                        pattern: /<!--[\\s\\S]*?-->/,
                        greedy: true
                    },
                    'frontmatter': {
                        pattern: /^---[\\s\\S]*?---$/m,
                        inside: {
                            'punctuation': /^---|---$/,
                            'yaml': {
                                pattern: /[\\s\\S]+/,
                                inside: Prism.languages.yaml
                            }
                        }
                    },
                    'tag': {
                        pattern: /{%[\\s\\S]*?%}/,
                        inside: {
                            'punctuation': /{%|%}/,
                            'keyword': /\\b(?:if|else|endif|for|in|endfor|include|extends|block|endblock)\\b/,
                            'string': {
                                pattern: /"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'/,
                                greedy: true
                            },
                            'operator': /[=!<>]=?|[+\\-*\\/]|\\b(?:and|or|not)\\b/,
                            'variable': {
                                pattern: /\\$[a-z_]\\w*/i,
                                greedy: true
                            },
                            'function': /\\b\\w+(?=\\()/,
                            'number': /\\b\\d+\\b/,
                            'boolean': /\\b(?:true|false)\\b/
                        }
                    },
                    'markdown': {
                        pattern: /[\\s\\S]+/,
                        inside: Prism.languages.markdown
                    }
                };

                // Register and highlight AIM language
                Prism.languages.aim = Prism.languages.extend('markup', Prism.languages.aim);
                document.addEventListener('DOMContentLoaded', (event) => {
                    Prism.highlightAll();
                });

                function showRunModal() {
                    document.getElementById('runModal').classList.add('show');
                }

                function closeRunModal() {
                    document.getElementById('runModal').classList.remove('show');
                }

                function showLoading() {
                    document.getElementById('loading').classList.remove('hidden');
                    document.getElementById('inputForm').classList.add('hidden');
                }

                function hideLoading() {
                    document.getElementById('loading').classList.add('hidden');
                    document.getElementById('inputForm').classList.remove('hidden');
                }

                async function executeDocument(inputs = {}) {
                    showLoading();
                    const requestId = Math.random().toString(36).substring(7);
                    
                    try {
                        const response = await fetch('/${apiPath}', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Request-ID': requestId
                            },
                            body: JSON.stringify(inputs)
                        });

                        if (!response.ok) {
                            throw new Error('Failed to execute document');
                        }

                        // Handle redirect to run page
                        window.location.href = response.url;

                    } catch (error) {
                        console.error('Error:', error);
                        hideLoading();
                        alert('Error executing document');
                    }
                }

                function submitRun() {
                    const inputs = {};
                    if (inputSchema) {
                        inputSchema.forEach(field => {
                            const input = document.querySelector(\`input[name="\${field.name}"]\`);
                            if (input) {
                                inputs[field.name] = input.value;
                            }
                        });
                    }
                    executeDocument(inputs);
                }

                function runDocument() {
                    showRunModal();
                }
            </script>
        </body>
    </html>
    `;
}
