import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Robust cookie storage for both Client and Server (via headers)
const cookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    const name = `${key}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) === 0) {
        // Match the stripping logic in route.ts
        let val = decodeURIComponent(c.substring(name.length, c.length));
        return val.replace(/^"|"$/g, '');
      }
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;
    // Cookies persist for 1 hour, sufficient for OAuth flow
    const date = new Date();
    date.setTime(date.getTime() + (60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();

    // Ensure value is not double-quoted before encoding
    const cleanValue = value.replace(/^"|"$/g, '');

    // Use Lax and Secure for Vercel. 
    // Always use path=/ to ensure server can read it at /auth/callback
    document.cookie = `${key}=${encodeURIComponent(cleanValue)}${expires}; path=/; SameSite=Lax; Secure`;
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  }
};

// Server-side client for DB operations (NOT for Auth Callback exchange)
export function getSupabaseServer() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Client-side client for Authentication
export function createSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'mr-auth', // Re-enforce a clean key
        storage: cookieStorage
      }
    }
  )
}
