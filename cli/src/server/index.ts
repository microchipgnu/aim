import { aim } from '@aim-sdk/core'
import express from 'express'
import { promises as fs } from 'node:fs'
import { getAIMRoutes } from './resolution'
import chalk from 'chalk'

interface ServerConfig {
  routesDir?: string;
  port?: number;
  hostname?: string;
}

export const createServer = async ({
  routesDir = './',
  port = 3000,
  hostname = '0.0.0.0'
}: ServerConfig = {}) => {
  const app = express();
  app.use(express.json());

  // Get AIM routes
  const routes = await getAIMRoutes(routesDir);
  console.log(chalk.dim(`Found ${routes.length} routes`));

  // Add index route that lists all routes
  app.get('/', (req, res) => {
    console.log(chalk.dim(`GET / - Listing ${routes.length} routes`));
    res.json({
      routes: routes.map(route => ({
        path: route.path,
        file: route.filePath
      }))
    });
  });

  // Add routes
  for (const route of routes) {
    app.get(route.path, async (req, res) => {
      console.log(chalk.dim(`GET ${route.path} - Serving AST`));
      const content = await fs.readFile(route.filePath, 'utf-8');
      const aimDocument = await aim`${content}`;

      if (aimDocument.errors.length > 0) {
        console.log(chalk.red(`⚠️  ${aimDocument.errors.length} errors found in ${route.path}`));
      }
      if (aimDocument.warnings.length > 0) {
        console.log(chalk.yellow(`⚠️  ${aimDocument.warnings.length} warnings found in ${route.path}`));
      }

      res.json({
        document: aimDocument.ast,
        errors: aimDocument.errors,
        warnings: aimDocument.warnings
      });
    });

    app.post(route.path, async (req, res) => {
      console.log(chalk.dim(`POST ${route.path} - Executing document`));
      const content = await fs.readFile(route.filePath, 'utf-8');
      const aimDocument = await aim`${content}`;
      const inputVariables = aimDocument.frontmatter?.input || [];
      const body = req.body;
      const input: Record<string, any> = {};

      for (const variable of inputVariables) {
        const value = body[variable.name];
        input[variable.name] = value ?? variable.schema?.default;
      }

      console.log(chalk.dim(`Executing with variables:`, input));

      const result = await aimDocument.execute({
        variables: input,
        onLog: (message: string) => {
          console.log(chalk.dim(`Log: ${message}`))
        }
      });

      console.log(chalk.green(`✓ Execution completed for ${route.path}`));

      res.json({
        output: result || null
      });
    });
  }

  app.listen(port, hostname);
  return app;
} 