import { aim } from '@aim-sdk/core'
import express from 'express'
import { promises as fs } from 'node:fs'
import { getAIMRoutes } from './resolution'

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

  // Add index route that lists all routes
  app.get('/', (req, res) => {
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
      const content = await fs.readFile(route.filePath, 'utf-8');
      const aimDocument = await aim`${content}`;
      res.json({
        document: aimDocument.ast,
        errors: aimDocument.errors,
        warnings: aimDocument.warnings
      });
    });

    app.post(route.path, async (req, res) => {
      const content = await fs.readFile(route.filePath, 'utf-8');
      const aimDocument = await aim`${content}`;
      const inputVariables = aimDocument.frontmatter?.input || [];
      const body = req.body;
      const input: Record<string, any> = {};

      for (const variable of inputVariables) {
        const value = body[variable.name];
        input[variable.name] = value ?? variable.schema?.default;
      }

      const result = await aimDocument.execute({
        variables: input,
        onLog: (message: string) => {
          console.log(message)
        }
      });

      res.json({
        output: result || null
      });
    });
  }

  app.listen(port, hostname);
  return app;
} 