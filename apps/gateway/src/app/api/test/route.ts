import { aim, defaultRuntimeOptions } from '@aim-sdk/core';
import { Sandbox } from '@e2b/code-interpreter';
import { z } from 'zod';

const content = `

\`\`\`js
// Simple function to demonstrate eval
function add(a, b) {
  return a + b;
}

const result = add(5, 3);

// Array manipulation example
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('Doubled numbers:', doubled);

// Object manipulation
const person = {
  name: 'Alice',
  age: 30
};
person.location = 'New York';
console.log('Person object:', person);
\`\`\`

`;

export async function GET(request: Request) {
  const aimDoc = aim({
    content: content,
    options: {
      ...defaultRuntimeOptions,
      env: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      },
      events: {
        onError: (error) => {
          console.error(error);
        },
        onLog: (message) => {
          console.log(message);
        },
      },
      adapters: [
        {
          type: 'code',
          handlers: {
            eval: async ({ code, language, variables }) => {
              const sbx = await Sandbox.create({
                envs: { ...variables },
                apiKey: process.env.E2B_API_KEY,
              });
              const execution = await sbx.runCode(code, { language });
              await sbx.kill();
              return {
                result: JSON.stringify(execution),
              };
            },
          },
        },
      ],
      tools: {
        test: {
          description: 'A test tool',
          parameters: z.object({
            name: z.string(),
          }),
          execute: async (input: unknown) => {
            return 1 + 1;
          },
        },
      },
    },
  });

  const result = [];
  for await (const chunk of aimDoc.executeWithGenerator({})) {
    result.push(chunk);
  }

  console.log(result);
  return new Response(JSON.stringify(result));
}
