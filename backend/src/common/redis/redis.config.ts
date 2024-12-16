export const redisConfig = {
  nodes: [
    {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT, 10) || 6788,
    },
  ],
};
