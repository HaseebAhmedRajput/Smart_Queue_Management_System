import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env';

export const createSupabaseClient = () => {
  if (!env.isSupabaseConfigured) {
    return null;
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
};

export const supabase = createSupabaseClient();
