import { aim } from "@aim-sdk/core";
import type { ValidateError } from "@markdoc/markdoc";
import chalk from 'chalk';
import { Command } from "commander";
import "dotenv/config";
import { nanoid } from "nanoid";
import { promises as fs } from 'node:fs';
import * as readline from 'node:readline';
import ora from 'ora';
import pkg from "./package.json" assert { type: "json" };
import { createServer } from "./server";
import { AIMManager } from "./server/services/aim-manager";
import { getAIMRoutes } from "./server/resolution";
import path from "node:path";
import loadConfig from "./utils/load-config";

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
# For running locally
OPENAI_API_KEY= # openai api key
REPLICATE_API_KEY= # replicate api key
OPENROUTER_API_KEY= # openrouter api key


# AIM's hosted inference service url
# AIM_INFERENCE_SERVER_URL= # AIM's hosted inference service url
# AIM_API_KEY= # AIM's api key

`;
      await fs.writeFile(`${name}/.env`, envContent);

      // Create .gitignore
      const gitignoreContent = `node_modules
.env
.DS_Store
dist/
*.log
output/
node_modules`;
      await fs.writeFile(`${name}/.gitignore`, gitignoreContent);

      await fs.writeFile(`${name}/aim.config.json`, JSON.stringify({
        inferenceServerUrl: process.env.AIM_INFERENCE_SERVER_URL,
      }));

      await fs.writeFile(`${name}/aim.config.ts`, `import { z } from "zod";

export default {
    tools: [
        {
            name: "test-tool",
            description: "This is a test tool",
            parameters: z.object({
                name: z.string(),
            }),
            execute: async (args: { name: string }) => {
                return \`Hello, \${args.name}!\`;
            },
        }
    ]
}`);

      // Create package.json
      const packageJson = {
        "name": name,
        "version": "0.1.0",
        "private": true,
        "dependencies": {
          "@aim-sdk/core": "latest",
          "zod": "latest",
          "aimx": "latest"
        },
        "scripts": {
          "start": "aimx serve files"
        }
      };
      await fs.writeFile(`${name}/package.json`, JSON.stringify(packageJson, null, 2));


      spinner.succeed('Project initialized successfully!');
      console.log(chalk.green(`\nCreated new AIM project in ./${name}`));
      console.log(chalk.dim('\nNext steps:'));
      console.log(chalk.dim('1. cd ' + name));
      console.log(chalk.dim('2. Add your API keys to .env'));
      console.log(chalk.dim('3. aimx serve files\n'));

    } catch (error) {
      spinner.fail('Failed to initialize project');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program
  .command("serve <dir>")
  .description("Start the AIM server")
  .option('-p, --port <number>', 'Port number', '3000')
  .action(async (dir, options) => {
    console.clear();

    console.log(chalk.cyan('AIM Server'));
    console.log(chalk.dim(`Starting server with configuration:`));
    console.log(chalk.dim(`• Routes directory: ${dir}`));
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
        routesDir: dir,
        enableUI: options.ui
      });

      spinner.succeed(chalk.green(`Server is running at ${chalk.bold(`http://localhost:${options.port}`)}`));

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

      const config = await loadConfig({
        configPath: path.join(process.cwd(), 'aim.config.ts'),
        defaultConfig: {
          tools: [],
          env: {},
          plugins: []
        }
      });

      const spinner = ora({
        text: 'Validating syntax...',
        color: 'cyan'
      }).start();

      const content = await fs.readFile(filepath, 'utf-8');

      const aimDocument = aim({
        content, options: {
          variables: {},
          tools: config.tools,
          env: config.env,
          plugins: config.plugins,
          signals: {
            abort: new AbortController().signal
          },
          config: {},
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
  .command("run <dir>")
  .description("Execute a single AIM file")
  .action(async (dir: string) => {
    try {
      console.clear();
      console.log(chalk.cyan('AIM Runner'));
      console.log(chalk.dim('Executing AIM file...\n'));

      const config = await loadConfig({
        configPath: path.join(process.cwd(), 'aim.config.ts'),
        defaultConfig: {
          tools: [],
          env: {},
          plugins: []
        }
      });

      const routes = await getAIMRoutes(dir);
      // Check if dir is a directory or file
      const stats = await fs.stat(dir);
      if (stats.isDirectory()) {
        const findMdFiles = async (dirPath: string): Promise<string[]> => {
          const files = await fs.readdir(dirPath);
          const results: string[] = [];

          for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory()) {
              const nestedFiles = await findMdFiles(fullPath);
              results.push(...nestedFiles);
            } else if (file.endsWith('.md')) {
              results.push(fullPath);
            }
          }

          return results;
        };

        const aimFiles = await findMdFiles(dir);

        if (aimFiles.length === 0) {
          console.log(chalk.yellow('No .aim files found in directory'));
          process.exit(0);
        }

        console.log(chalk.cyan('\nAvailable .aim files:'));
        aimFiles.forEach((file, i) => {
          // Get relative path from input directory
          const relativePath = path.relative(dir, file);
          console.log(`${chalk.cyan(i + 1)}. ${relativePath}`);
        });

        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise<string>(resolve => {
          readline.question('\nEnter the number of the file to run: ', resolve);
        });
        readline.close();

        const fileIndex = parseInt(answer) - 1;
        if (isNaN(fileIndex) || fileIndex < 0 || fileIndex >= aimFiles.length) {
          console.log(chalk.red('Invalid selection'));
          process.exit(1);
        }

        dir = aimFiles[fileIndex];
      }

      // If dir is a file, verify it's an .aim file
      if (!dir.endsWith('.md')) {
        console.log(chalk.red('File must have .md extension'));
        process.exit(1);
      }

      const aimContent = await fs.readFile(dir, 'utf-8');
      const aimManager = new AIMManager(routes, config.tools, config.env, config.plugins);
      const inputSchema = await aimManager.getInputSchema(aimContent);
      let variables: Record<string, string> = {};

      if (inputSchema) {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const question = (prompt: string) => new Promise<string>(resolve => {
          readline.question(prompt, resolve);
        });

        try {
          // Since we know schema is an array of objects with name property
          for (const schema of inputSchema as Array<{ name: string }>) {
            const value = await question(chalk.cyan(`Enter value for ${schema.name}: `));
            variables[schema.name] = value;
          }

          readline.close();
        } catch (e) {
          readline.close();
          console.error(chalk.red('Error processing inputs:'), e);
          process.exit(1);
        }
      }

      await aimManager.executeDocument(aimContent, variables, nanoid(), undefined, true);
      process.exit(0);
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