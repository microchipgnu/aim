import { promises as fs } from 'fs';
import path from 'path';

interface RouteFile {
  path: string;      // Route path (e.g., /blog/[id])
  filePath: string;  // Actual file path on disk
}

/**
 * Recursively scans a directory to find all AIM files and maps them to routes
 * Following Next.js routing conventions:
 * - [...slug] for catch-all routes
 * - [[...slug]] for optional catch-all routes
 * - (group) for route groups that don't affect URL path
 * - @parallel/sequential for parallel/sequential route groups
 */
export async function getAIMRoutes(directory: string, extensions: string[] = ['aim', 'aimd', 'md', 'mdx']): Promise<RouteFile[]> {
  const routes: RouteFile[] = [];
  
  async function scan(dir: string, routePrefix: string = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip private folders starting with _
        if (entry.name.startsWith('_')) {
          continue;
        }

        // Handle route grouping with (group)
        if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
          await scan(fullPath, routePrefix);
          continue;
        }

        // Handle parallel/sequential route groups
        if (entry.name.startsWith('@')) {
          await scan(fullPath, routePrefix);
          continue;
        }

        // Handle dynamic route segments
        let routePart = entry.name;
        if (entry.name.startsWith('[') && entry.name.endsWith(']')) {
          // Handle catch-all routes [...param]
          if (entry.name.startsWith('[...')) {
            routePart = '*';
          }
          // Handle optional catch-all routes [[...param]]
          else if (entry.name.startsWith('[[...')) {
            routePart = '*?';
          }
          // Regular dynamic route [param]
          else {
            routePart = entry.name;
          }
        }
          
        await scan(fullPath, path.join(routePrefix, routePart));
      } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(`.${ext}`))) {
        // Skip files starting with _
        if (entry.name.startsWith('_')) {
          continue;
        }

        // Convert file name to route part (index.aim -> /, about.aim -> /about)
        const isIndex = extensions.some(ext => entry.name === `index.${ext}`);
        const routePart = isIndex
          ? ''
          : '/' + entry.name.replace(new RegExp(`\\.(${extensions.join('|')})$`), '');
          
        routes.push({
          path: path.join(routePrefix, routePart).replace(/\\/g, '/'),
          filePath: fullPath
        });
      }
    }
  }

  await scan(directory);
  return routes;
}
