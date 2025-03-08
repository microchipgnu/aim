import { config } from '../src/config/app.config';
import { createServer } from '../src/server';

const main = async () => {
  try {
    await createServer({ port: Number(config.port) });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

main();
