---
title: Basic Usage
---

Execute the runtime in a Node.js application.


```markdown
aim/
├── routes/ # AIM routes
│ ├── doc1.md
│ └── doc3.md
└── .env # Environment variables
```


```javascript
import * as readline from 'readline';
import { aim } from "@aim-sdk/runtime";
import fs from 'fs';
import { join } from 'path';

const createUserInputHandler = () => {
  return async (prompt: string): Promise<string> => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>(resolve => {
      rl.question(prompt + ' ', resolve);
      rl.close();
    });
    
    return answer;
  };
};

const handleExit = (code: number, message?: string) => {
  message && console.log(message);
  process.exit(code);
};

const aimContent = fs.readFileSync(join(__dirname, 'simple.md'), 'utf-8');
const aimDocument = await aim`${aimContent}`;

console.log(JSON.stringify(aimDocument, null, 2))

process.on('SIGINT', () => handleExit(1, 'Stopping execution...'));

aimDocument
  .execute({
    onData: (data: unknown) => console.log(`Data: ${JSON.stringify(data)}`),
    onUserInput: createUserInputHandler(),
    onLog: (log: string) => console.log(`Log: ${log}`),
    onStep: (step: string) => console.log(`Step: ${step}`),
    input: {
      message: "Hello"
    }
  })
  .then(() => handleExit(0))
  .catch(error => {
    console.error('Execution failed:', error);
    handleExit(1);
  });
```

```markdown
---
title: Test
input:
  - name: message
    description: The message to process
    required: true
    schema:
      type: string
  - name: count
    description: Number of items to return
    required: false
    schema:
      type: integer
      default: 10
---

create a prompt to create an image in dali style of a {{input.message}}

::ai{#response model="meta-llama/llama-3.2-3b-instruct:free@openrouter"}

$response

::replicate{#image model="black-forest-labs/flux-schnell"}

$image

```