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