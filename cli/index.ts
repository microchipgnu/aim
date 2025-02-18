import { aim, defaultRuntimeOptions, renderers, type RenderableTreeNode } from "@aim-sdk/core";
import chalk from 'chalk';
import { Command } from "commander";
import "dotenv/config";
import { promises as fs } from 'node:fs';
import path from "node:path";
import * as readline from 'node:readline';
import ora from 'ora';
import pkg from "./package.json" assert { type: "json" };
import loadConfig from "./utils/load-config";

// Initialize Commander
const program = new Command();

// Display banner
console.log(`\n${chalk.cyan('AIM CLI')}`);
console.log(chalk.dim(`v${pkg.version}\n`));

program
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version);

program
  .command("init")
  .description("Initialize a new AIM project")
  .argument('[name]', 'Project name')
  .action(async (initialName?: string) => {
    console.log(chalk.cyan('AIM Project Initializer'));

    // If no name provided, prompt for one
    let projectName = initialName;
    if (!projectName) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      projectName = await new Promise<string>(resolve => {
        rl.question('Project name: ', answer => {
          rl.close();
          resolve(answer);
        });
      });
    }

    if (!projectName) {
      console.log(chalk.red('Project name is required'));
      process.exit(1);
    }

    console.log(chalk.dim(`\nInitializing project "${projectName}"...\n`));

    const spinner = ora({
      text: 'Creating project files...',
      color: 'cyan'
    }).start();

    try {
      // Create project directory
      await fs.mkdir(projectName, { recursive: true });

      // Create necessary directories
      await fs.mkdir(`${projectName}/files`, { recursive: true });

      // Create README.md
      const readmeContent = `# ${projectName}

This is an AIM (AI Markup) project that allows you to create interactive AI-powered content.

## Getting Started

1. Add your AI provider API keys in the .env file
2. Create your content files in the /files directory
3. Run \`aim start -d . --ui\` to start the development server

## Documentation

For full documentation, visit [docs.aimarkup.org](https://docs.aimarkup.org)
`;
      await fs.writeFile(`${projectName}/README.md`, readmeContent);

      // Create example file
      const exampleContent = "# Hello World";
      await fs.writeFile(`${projectName}/files/example.md`, exampleContent);

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
      await fs.writeFile(`${projectName}/.env`, envContent);

      // Create .gitignore
      const gitignoreContent = `node_modules
.env
.DS_Store
dist/
*.log
output/
node_modules`;
      await fs.writeFile(`${projectName}/.gitignore`, gitignoreContent);

      await fs.writeFile(`${projectName}/aim.config.json`, JSON.stringify({
        inferenceServerUrl: process.env.AIM_INFERENCE_SERVER_URL,
      }));

      await fs.writeFile(`${projectName}/aim.config.ts`, `import { z } from "zod";

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
        "name": projectName,
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
      await fs.writeFile(`${projectName}/package.json`, JSON.stringify(packageJson, null, 2));


      spinner.succeed('Project initialized successfully!');
      console.log(chalk.green(`\nCreated new AIM project in ./${projectName}`));
      console.log(chalk.dim('\nNext steps:'));
      console.log(chalk.dim(`1. cd ${projectName}`));
      console.log(chalk.dim('2. Add your API keys to .env'));
      console.log(chalk.dim('3. aimx serve files\n'));

    } catch (error) {
      spinner.fail('Failed to initialize project');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program
  .command("run <dir>")
  .description("Execute a single AIM file")
  .action(async (originalPath: string) => {
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

      // Get path to markdown file to execute
      const getMarkdownFilePath = async (dirPath: string): Promise<string> => {
        const stats = await fs.stat(dirPath);
        
        if (!stats.isDirectory()) {
          if (!dirPath.endsWith('.md')) {
            throw new Error('File must have .md extension');
          }
          return dirPath;
        }

        const findMarkdownFiles = async (dir: string): Promise<string[]> => {
          const entries = await fs.readdir(dir);
          const results: string[] = [];

          for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const stat = await fs.stat(fullPath);

            if (stat.isDirectory()) {
              results.push(...await findMarkdownFiles(fullPath));
            } else if (entry.endsWith('.md')) {
              results.push(fullPath);
            }
          }

          return results;
        };

        const markdownFiles = await findMarkdownFiles(dirPath);

        if (markdownFiles.length === 0) {
          throw new Error('No markdown files found in directory');
        }

        console.log(chalk.cyan('\nAvailable markdown files:'));
        markdownFiles.forEach((file, i) => {
          const relativePath = path.relative(dirPath, file);
          console.log(`${chalk.cyan(i + 1)}. ${relativePath}`);
        });

        const readline = require('node:readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise<string>(resolve => {
          readline.question('\nEnter the number of the file to run: ', resolve);
        });
        readline.close();

        const fileIndex = Number.parseInt(answer) - 1;
        if (Number.isNaN(fileIndex) || fileIndex < 0 || fileIndex >= markdownFiles.length) {
          throw new Error('Invalid file selection');
        }

        return markdownFiles[fileIndex];
      };

      // Get user input based on schema
      const getUserInput = async (schema: Array<{name: string}>) => {
        const readline = require('node:readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const variables: Record<string, string> = {};

        const question = (prompt: string) => new Promise<string>(resolve => {
          readline.question(prompt, resolve);
        });

        try {
          for (const {name} of schema) {
            variables[name] = await question(chalk.cyan(`Enter value for ${name}: `));
          }
        } finally {
          readline.close();
        }

        return variables;
      };

      // Execute the document
      const executeDocument = async (filePath: string, variables: Record<string, string>) => {
        const content = await fs.readFile(filePath, 'utf-8');
        
        const document = aim({
          content,
          options: {
            ...defaultRuntimeOptions,
            timeout: 1000 * 60 * 5,
            events: {
              onError: console.error,
              onLog: console.log,
              onToolCall: (name, args) => console.log(name, args),
            },
            tools: config.tools,
            env: config.env,
            plugins: config.plugins,
            experimental_files: {
              [filePath]: { content }
            },
          },
        });

        for await (const result of document.executeWithGenerator({ input: variables })) {
          console.log(renderers.html(result as RenderableTreeNode[]));
        }
      };

      // Main execution flow
      const filePath = await getMarkdownFilePath(originalPath);
      const inputSchema = undefined
      
      const variables = inputSchema ? 
        await getUserInput(inputSchema as unknown as Array<{name: string}>) :
        {};

      await executeDocument(filePath, variables);
      process.exit(0);

    } catch (error) {
      console.error('Execution failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command("deploy")
  .description("Deploy project");

// Parse CLI arguments
program.parse(process.argv);