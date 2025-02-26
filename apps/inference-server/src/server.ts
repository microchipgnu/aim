import cors from 'cors';
import express from 'express';
import aimRoutes from './routes/aim.routes';
import storageRoutes from './routes/storage.routes';

export const createServer = async ({ port }: { port: number }) => {
  const app = express();

  app.get('/', (req, res) => {
    res.send(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>AIM Inference Server</title>
                </head>
                <body>
                    <h1>AIM Inference Server</h1>
                    <p>Welcome to the AIM Inference Server API.</p>
                    <p>For more information, please visit <a href="https://aim.microchipgnu.pt">https://aim.microchipgnu.pt</a></p>
                </body>
            </html>
        `);
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      origin: process.env.GATEWAY_URL || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Origin',
        'Accept',
        'X-Requested-With',
      ],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      credentials: true,
    }),
  );

  app.use('/aim/v1', aimRoutes);

  app.use('/storage', storageRoutes);

  return new Promise<void>((resolve, reject) => {
    try {
      app.listen(port, () => {
        console.log(`Server started on http://localhost:${port}`);
        resolve();
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      reject(error);
    }
  });
};
