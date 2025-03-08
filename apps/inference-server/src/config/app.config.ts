export const config = {
  port: process.env.SERVER_PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  aim: {
    useScoping: false,
    // other AIM-specific configs
  },
} as const;
