module.exports = {
  apps: [
    {
      name: "vitech-fe",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "./",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        ADMIN_USERNAME: "admin",
        ADMIN_PASSWORD: "vitech2026",
        ADMIN_SECRET: "vitech-admin-secret-key-change-in-production",
        NESTJS_API_URL: "http://localhost:3002/api",
      },
    },
  ],
};
