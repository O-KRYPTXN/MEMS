import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define the schema for our environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  EMAIL_FROM: z.string().email('EMAIL_FROM must be a valid email address'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
});

// Validate the process.env object
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

// Export the validated environment variables
export const env = parsedEnv.data;
