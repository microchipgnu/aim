import { $runtimeContext, $textRegistry, aim } from "index"


$runtimeContext.watch((state) => {
    console.log('Runtime context updated:', {
        stackSize: state.stack.length,
        dataKeys: Object.keys(state.data),
        pluginCount: state.plugins.size,
        adapterCount: state.adapters.size,
        textRegistryCount: state.textRegistry.length,
        text: state.textRegistry,
        stack: state.stack,
        variables: state.stack
    });
});

// Watch text registry changes 
$textRegistry.watch((state) => {
    console.log('Text registry updated:', {
        entryCount: state.length,
        lastEntry: state[state.length - 1]
    });
});


const content = `---
title: Test
input:
  - name: problem
    type: string
    description: "The math problem to solve"
---

{% set #var greeting=$frontmatter.input.problem /%}

\`\`\`js {% #code %}

const result = aimVariables.var.greeting;

export default result;
\`\`\`

{% $code.result %}
`

const doc = aim({
    content,
    options: {
        signal: new AbortController().signal,
        events: {
            onLog: console.log,
            onError: console.error,
            onSuccess: console.log,
            onAbort: console.warn,
            onFinish: console.log,
            onStart: console.log,
            onStep: console.log,
            onData: console.log,
            onOutput: async (output) => { console.log(output) },
            onUserInput: async (prompt) => { console.log(prompt); return "" },
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
                            runtime: async ({ node, execution }) => {
                                execution.runtime.context.methods.pushStack({
                                    id: node.attributes.id,
                                    variables: {
                                        hash: "0x1234567890",
                                    }
                                })
                                execution.runtime.context.methods.addToTextRegistry("The hash is 0x1234567890");
                                return "The hash is 0x1234567890";
                            }
                        }
                    }
                },
                options: {}
            },
            {
                plugin: {
                    name: 'sleep',
                    version: '0.0.1', 
                    tags: {
                        "sleep": {
                            render: "sleep",
                            attributes: {
                                seconds: { type: Number, required: true }
                            },
                            runtime: async ({ node, execution, config }) => {
                                console.log("=================")
                                const currentConfig = await execution.runtime.context.methods.getCurrentConfig(config)
                                const seconds = node.transformAttributes(currentConfig).seconds?.resolve ? node.transformAttributes(currentConfig).seconds.resolve(currentConfig) : node.transformAttributes(currentConfig).seconds;

                                execution.runtime.context.methods.addToTextRegistry(`SLEEPING FOR ${seconds} seconds`)
                                await new Promise(resolve => setTimeout(resolve, seconds * 1000));
                                return "";
                            }
                        }
                    }
                },
                options: {}
            }
        ],
    }
})


await doc.execute({
    input: {
        problem: "What is 2 + 2?"
    }
})
process.exit(0)


