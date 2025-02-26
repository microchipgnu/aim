import type { Express } from 'express';
import { getAIMRoutes } from '../resolution';
import { openAPIManager } from '../services/openapi-manager';

export const setupManifests = async (app: Express, routesDir: string) => {
  const routes = await getAIMRoutes(routesDir);

  await openAPIManager.initialize(routes);

  // Add OpenAPI and plugin.json routes
  app.get('/.well-known/openapi.json', (req, res) => {
    const spec = openAPIManager.generateOpenAPISpec();
    res.json(spec);
  });

  app.get('/.well-known/ai-plugin.json', (req, res) => {
    const plugin = openAPIManager.generateAIPlugin();
    res.json(plugin);
  });

  return routes;
};
