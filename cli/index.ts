#!/usr/bin/env node

import { createServer } from "@aim-sdk/server";
import { Command } from "commander";
import "dotenv/config";
import pkg from "./package.json" assert { type: "json" };

// Initialize Commander
const program = new Command();

program
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version);

program
  .command("start")
  .description("Display the AIMD welcome message")
  .action(async () => {
    console.clear();

    await createServer({
      port: 3000,
      routesDir: "./routes",
    });
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