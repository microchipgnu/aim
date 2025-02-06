import { aim } from "@aim-sdk/core";
import type { ValidateError } from "@markdoc/markdoc";
import chalk from 'chalk';
import { Command } from "commander";
import "dotenv/config";
import { promises as fs } from 'node:fs';
import * as readline from 'node:readline';
import ora from 'ora';
import pkg from "./package.json" assert { type: "json" };
import { createServer } from "./server";

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
  .command("init")
  .description("Initialize a new AIM project")
  .argument('[name]', 'Project name')
  .action(async (name?: string) => {
    console.log(chalk.cyan('AIM Project Initializer'));

    // If no name provided, prompt for one
    if (!name) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      name = await new Promise<string>(resolve => {
        rl.question('Project name: ', answer => {
          rl.close();
          resolve(answer);
        });
      });
    }

    if (!name) {
      console.log(chalk.red('Project name is required'));
      process.exit(1);
    }

    console.log(chalk.dim(`\nInitializing project "${name}"...\n`));

    const spinner = ora({
      text: 'Creating project files...',
      color: 'cyan'
    }).start();

    try {
      // Create project directory
      await fs.mkdir(name, { recursive: true });

      // Create necessary directories
      await fs.mkdir(`${name}/files`, { recursive: true });

      // Create README.md
      const readmeContent = `# ${name}

This is an AIM (AI Markup) project that allows you to create interactive AI-powered content.

## Getting Started

1. Add your AI provider API keys in the .env file
2. Create your content files in the /files directory
3. Run \`aim start -d . --ui\` to start the development server

## Documentation

For full documentation, visit [docs.aimarkup.org](https://docs.aimarkup.org)
`;
      await fs.writeFile(`${name}/README.md`, readmeContent);

      // Create example file
      const exampleContent = `# Hello World`;
      await fs.writeFile(`${name}/files/example.md`, exampleContent);

      // Create .env file
      const envContent = `# Add your API keys here
# AI Providers
OPENAI_API_KEY=""
REPLICATE_API_KEY=""
OPENROUTER_API_KEY=""

# Authentication
CLERK_SECRET_KEY=""
CLERK_PUBLISHABLE_KEY=""
VITE_CLERK_PUBLISHABLE_KEY=""
`;
      await fs.writeFile(`${name}/.env`, envContent);

      // Create .gitignore
      const gitignoreContent = `node_modules/
.env
.DS_Store
dist/
*.log`;
      await fs.writeFile(`${name}/.gitignore`, gitignoreContent);

      spinner.succeed('Project initialized successfully!');
      console.log(chalk.green(`\nCreated new AIM project in ./${name}`));
      console.log(chalk.dim('\nNext steps:'));
      console.log(chalk.dim('1. cd ' + name));
      console.log(chalk.dim('2. Add your API keys to .env'));
      console.log(chalk.dim('3. aim start -d . --ui\n'));

    } catch (error) {
      spinner.fail('Failed to initialize project');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program
  .command("serve")
  .description("Start the AIM server")
  .option('-d, --dir <path>', 'Routes directory path', './routes')
  .option('-p, --port <number>', 'Port number', '3000')
  .option('--ui', 'Enable web UI', false)
  .action(async (options) => {
    console.clear();

    console.log(chalk.cyan('AIM Server'));
    console.log(chalk.dim(`Starting server with configuration:`));
    console.log(chalk.dim(`• Routes directory: ${options.dir}`));
    console.log(chalk.dim(`• Port: ${options.port}`));
    if (options.ui) {
      console.log(chalk.dim(`• Web UI: enabled`));
    }

    const spinner = ora({
      text: 'Starting development server...',
      color: 'cyan'
    }).start();

    try {
      await createServer({
        port: parseInt(options.port),
        routesDir: options.dir,
        enableUI: options.ui
      });

      spinner.succeed(chalk.green(`Server is running at ${chalk.bold(`http://localhost:${options.port}`)}`));
      if (options.ui) {
        console.log(chalk.green(`Web UI available at ${chalk.bold(`http://localhost:${options.port}/ui`)}`));
      }

      console.log(chalk.dim('\nPress Ctrl+C to stop the server\n'));
    } catch (error) {
      spinner.fail(chalk.red(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }

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
      const aimDocument = aim({
        content, options: {
          variables: {},
          signals: {
            abort: new AbortController().signal
          },
          config: {},
          events: {
            onLog: (message) => console.log(chalk.dim(`Log: ${message}`))
          },
          settings: {
            useScoping: false
          }
        }
      });

      spinner.stop();

      console.log(chalk.dim('Finished validating syntax.\n'));

      // Validation results
      const validationResults = [];

      if (aimDocument.errors.length > 0) {
        validationResults.push('\n' + chalk.red.bold('⚠️  Errors:'));
        aimDocument.errors.forEach((error: ValidateError, index) => {
          validationResults.push(chalk.red(`  ${index + 1}. ${error}`));
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
      const aimDocument = aim({
        content: aimContent, options: {
          variables: {},
          signals: {
            abort: new AbortController().signal
          },
          config: {},
          events: {
            onLog: (message) => console.log(chalk.dim(`Log: ${message}`))
          },
          settings: {
            useScoping: false
          }
        }
      });

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

      await aimDocument.execute(variables);

    } catch (error) {
      console.error('Execution failed:', error);
      process.exit(1);
    }
  });


program
  .command("deploy")
  .description("Deploy project");

// Parse CLI arguments
program.parse(process.argv);