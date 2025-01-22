import { $stateChain, aim } from "index"


const content2 = `---
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

{% $output.result %}
`

const content3 = `

{% loop #loop count=2 %}

    {% if equals($loop.index, 1) %}

        What is the number the first time? {% $loop.index %}

    {% else /%}

        What is the number the second time? {% $loop.index %}

    {% /if %}

{% /loop %}

`

const doc = aim({
    content: content3,
    options: {
        signal: new AbortController().signal,
        settings: {
            useScoping: false
        },
        // events: {
        //     onLog: console.log,
        //     onError: console.error,
        //     onSuccess: console.log,
        //     onAbort: console.warn,
        //     onFinish: console.log,
        //     onStart: console.log,
        //     onStep: console.log,
        //     onData: console.log,
        //     onOutput: async (output) => { console.log(output) },
        //     onUserInput: async (prompt) => { console.log(prompt); return "" },
        // },  
        config: {},
        plugins: []
        // plugins: [
        //     {
        //         plugin: {
        //             name: 'sign-eth-transaction',
        //             version: '0.0.1',
        //             tags: {
        //                 "sign-eth-transaction": {
        //                     render: "sign-eth-transaction",
        //                     runtime: async ({ node, execution }) => {
        //                         execution.runtime.context.methods.pushStack({
        //                             id: node.attributes.id,
        //                             variables: {
        //                                 hash: "0x1234567890",
        //                             },
        //                             scope: execution.scope
        //                         })
        //                         execution.runtime.context.methods.addToTextRegistry({ text: "The hash is 0x1234567890", scope: execution.scope });
        //                         return "The hash is 0x1234567890";
        //                     }
        //                 }
        //             }
        //         },
        //         options: {}
        //     },
        //     {
        //         plugin: {
        //             name: 'sleep',
        //             version: '0.0.1', 
        //             tags: {
        //                 "sleep": {
        //                     render: "sleep",
        //                     attributes: {
        //                         seconds: { type: Number, required: true }
        //                     },
        //                     runtime: async ({ node, execution, config }) => {
        //                         console.log("=================")
        //                         const currentConfig = await execution.runtime.context.methods.getCurrentConfig(config)
        //                         const seconds = node.transformAttributes(currentConfig).seconds?.resolve ? node.transformAttributes(currentConfig).seconds.resolve(currentConfig) : node.transformAttributes(currentConfig).seconds;

        //                         execution.runtime.context.methods.addToTextRegistry({ text: `SLEEPING FOR ${seconds} seconds`, scope: execution.scope });
        //                         await new Promise(resolve => setTimeout(resolve, seconds * 1000));
        //                         return "";
        //                     }
        //                 }
        //             }
        //         },
        //         options: {}
        //     }
        // ],
    }
})


await doc.execute()


console.log(JSON.stringify($stateChain.getState(), null, 2))
process.exit(0)
