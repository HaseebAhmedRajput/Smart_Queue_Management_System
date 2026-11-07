import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { env } from '../../config/env';

export interface CookieHandler {
  get: (name: string) => string | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
  remove: (name: string, options: CookieOptions) => void;
}

export function createSupabaseServerClient(cookieHandler?: CookieHandler) {
  if (!env.isSupabaseConfigured) {
    return null;
  }

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieHandler?.get(name);
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieHandler?.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        cookieHandler?.remove(name, options);
      },
    },
  });
}
