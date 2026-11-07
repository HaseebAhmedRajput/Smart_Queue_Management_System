// 
import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  SUPABASE_ANON_KEY: z.string().optional().or(z.literal('')),
  APP_URL: z.string().optional(),
});

const rawEnv = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000',
};

const parsed = envSchema.safeParse(rawEnv);

export const env = {
  SUPABASE_URL: parsed.success
    ? parsed.data.SUPABASE_URL || ''
    : '',
  SUPABASE_ANON_KEY: parsed.success
    ? parsed.data.SUPABASE_ANON_KEY || ''
    : '',
  APP_URL: parsed.success
    ? parsed.data.APP_URL || 'http://localhost:3000'
    : 'http://localhost:3000',
  isSupabaseConfigured: Boolean(
    parsed.success &&
      parsed.data.SUPABASE_URL &&
      parsed.data.SUPABASE_ANON_KEY
  ),
};
