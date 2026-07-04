import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email'),
  password: z.string().min(1, 'Please provide a password'),
});

export const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please provide a valid email'),
  role: z.string().min(1, 'Role is required'),
  department: z.string().min(1, 'Department is required'),
});

export const activateSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});
