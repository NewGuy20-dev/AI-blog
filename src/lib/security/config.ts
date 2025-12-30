// Server-side security configuration
// This file should only be imported in server-side code (API routes, middleware, etc.)

export const SECURITY_CONFIG = {
  ADMIN_USER_ID: process.env.ADMIN_USER_ID!,
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL!,
  EMERGENCY_LOCKDOWN_KEY: process.env.EMERGENCY_LOCKDOWN_KEY!,
  JWT_SECRET: process.env.JWT_SECRET!,
} as const;

// Validate that all required environment variables are present
const requiredEnvVars = [
  'ADMIN_USER_ID',
  'DISCORD_WEBHOOK_URL', 
  'EMERGENCY_LOCKDOWN_KEY',
  'JWT_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
