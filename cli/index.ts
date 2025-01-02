#!/usr/bin/env node

import { createServer } from "@aim-sdk/server";
import { aim } from "@aim-sdk/runtime";
import { Command } from "commander";
import "dotenv/config";
import pkg from "./package.json" assert { type: "json" };
import fs from 'fs';
import * as readline from 'readline';
import { compile } from "@aim-sdk/compiler";

// Initialize Commander
const program = new Command();

program
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version);
  
program
  .command("start")
  .description("Start the AIM server")
  .option('-d, --dir <path>', 'Routes directory path', './routes')
  .action(async (options) => {
    console.clear();

    await createServer({
      port: 3000,
      routesDir: options.dir,
    });
  });

program
  .command("compile <filepath>")
  .description("Compile an AIM file and output the parsed document")
  .action(async (filepath: string) => {
    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      const { document, errors } = await compile(content);
      
      console.log(JSON.stringify({ document, errors }, null, 2));
    } catch (error) {
      console.error('Compilation failed:', error);
      process.exit(1);
    }
  });

program
  .command("run <filepath>")
  .description("Execute a single AIM file")
  .option('-v, --variables <json>', 'Input variables as JSON string')
  .action(async (filepath: string, options: { variables?: string }) => {
    try {
      const aimContent = fs.readFileSync(filepath, 'utf-8');
      const aimDocument = await aim`${aimContent}`;

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

      let variables = {};
      if (options.variables) {
        try {
          variables = JSON.parse(options.variables);
        } catch (e) {
          console.error('Failed to parse variables JSON:', e);
          process.exit(1);
        }
      }

      await aimDocument.execute({
        onData: (data: unknown) => console.log(`Data: ${JSON.stringify(data)}`),
        onUserInput: createUserInputHandler(),
        onLog: (log: string) => console.log(`Log: ${log}`),
        onStep: (step: string) => console.log(`Step: ${step}`),
        variables: variables
      });

    } catch (error) {
      console.error('Execution failed:', error);
      process.exit(1);
    }
  });

// program
//   .command("ask")
//   .description("Ask a question")
//   .action(async () => {
//     console.clear();

//     console.log(chalk.blue(figlet.textSync("Question Time!")));
//     const answers = await inquirer.prompt([
//       {
//         type: "input",
//         name: "username",
//         message: "What is your name?",
//       },
//       {
//         type: "list",
//         name: "favoriteColor",
//         message: "Choose your favorite color:",
//         choices: ["Red", "Green", "Blue", "Yellow"],
//       },
//     ]);

//     console.log(
//       chalk.green(`Hello, ${answers.username}! Your favorite color is ${answers.favoriteColor}.`)
//     );
//   });

// program
//   .command("ui")
//   .description("Display a simple console menu")
//   .action(async () => {
//     console.clear();
    
//     console.log(chalk.cyan(figlet.textSync("Console Menu")));
//     console.log("\nSelect an option:");

//     const { choice } = await inquirer.prompt([
//       {
//         type: "list",
//         name: "choice",
//         message: "Choose an option:",
//         choices: ["Option 1", "Option 2", "Option 3", "Exit"]
//       }
//     ]);

//     if (choice === "Exit") {
//       console.log("Goodbye!");
//       process.exit(0);
//     } else {
//       console.log(chalk.green(`You selected: ${choice}`));
//       console.log("Performing some action...");
//     }
//   });

// Parse CLI arguments
program.parse(process.argv);