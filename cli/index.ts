import { aim } from "@aim-sdk/core";
import { Command } from "commander";
import "dotenv/config";
import { promises as fs } from 'node:fs';
import * as readline from 'node:readline';
import pkg from "./package.json" assert { type: "json" };
import { createServer } from "./src/server";
import chalk from 'chalk';
import type { ValidationError } from "@markdoc/markdoc";
import ora from 'ora';

// Initialize Commander
const program = new Command();

// Display banner
console.log('\n' + chalk.cyan('AIM CLI'));
console.log(chalk.dim(`v${pkg.version}\n`));

program
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version);
  
program
  .command("start")
  .description("Start the AIM server")
  .option('-d, --dir <path>', 'Routes directory path', './routes')
  .option('-p, --port <number>', 'Port number', '3000')
  .action(async (options) => {
    console.clear();
    
    console.log(chalk.cyan('AIM Server'));
    console.log(chalk.dim(`Starting server with configuration:`));
    console.log(chalk.dim(`• Routes directory: ./${options.dir}`));
    console.log(chalk.dim(`• Port: ${options.port}\n`));
    
    const spinner = ora({
      text: 'Starting development server...',
      color: 'cyan'
    }).start();

    spinner.succeed(chalk.green(`Server is running at ${chalk.bold(`http://localhost:${options.port}`)}`));

    await createServer({
      port: parseInt(options.port),
      routesDir: options.dir,
    });


    console.log(chalk.dim('Press Ctrl+C to stop the server\n'));

    // Handle exit events
    const cleanup = () => {
      spinner.stop();
      console.log(chalk.yellow('\nShutting down server...'));
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  });

program
  .command("compile <filepath>")
  .description("Compile an AIM file and validate its syntax")
  .action(async (filepath: string) => {
    try {
      console.clear();
      console.log(chalk.cyan('AIM Compiler'));

      const spinner = ora({
        text: 'Validating syntax...',
        color: 'cyan'
      }).start();
      
      const content = await fs.readFile(filepath, 'utf-8');
      const aimDocument = await aim`${content}`;
      
      spinner.stop();

      console.log(chalk.dim('Finished validating syntax.\n'));

      // Validation results
      const validationResults = [];

      if (aimDocument.errors.length > 0) {
        validationResults.push('\n' + chalk.red.bold('⚠️  Errors:'));
        aimDocument.errors.forEach((error: ValidationError, index) => {
          validationResults.push(chalk.red(`  ${index + 1}. ${error.message}`));
        });
      }

      if (aimDocument.warnings.length > 0) {
        validationResults.push('\n' + chalk.yellow.bold('⚠️  Warnings:'));
        aimDocument.warnings.forEach((warning, index) => {
          validationResults.push(chalk.yellow(`  ${index + 1}. ${warning.error.message}`));
        });
      }

      if (validationResults.length > 0) {
        console.log(validationResults.join('\n'));
      } else {
        console.log('\n' + chalk.green.bold('✓ No errors or warnings found.'));
      }

      // Exit with error code if there are errors
      if (aimDocument.errors.length > 0) {
        process.exit(1);
      }

    } catch (error) {
      console.log('\n' + chalk.red.bold('❌ Compilation Failed'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program
  .command("run <filepath>")
  .description("Execute a single AIM file")
  .option('-v, --variables <json>', 'Input variables as JSON string')
  .action(async (filepath: string, options: { variables?: string }) => {
    try {
      console.clear();
      console.log(chalk.cyan('AIM Runner'));
      console.log(chalk.dim('Executing AIM file...\n'));

      const aimContent = await fs.readFile(filepath, 'utf-8');
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

//     console.log(chalk.blue("Question Time!"));
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
    
//     console.log(chalk.cyan("Console Menu"));
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