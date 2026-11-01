import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce',
        detectSessionInUrl: false,
      },
    });
  } catch (err) {
    console.error('Error inicializando cliente de Supabase:', err);
  }
}

export function getSupabase(): SupabaseClient | null {
  return supabaseInstance;
}

export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabase();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user;
}

/** Exchange the authorization code returned by Supabase OAuth before loading user data. */
let callbackExchange: Promise<void> | null = null;

export async function completeAuthCallback(): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  if (callbackExchange) return callbackExchange;

  const params = new URLSearchParams(window.location.search);
  const authError = params.get('error_description') || params.get('error');
  if (authError) throw new Error(authError);
  const code = params.get('code');
  if (!code) return;

  callbackExchange = (async () => {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw error;
    params.delete('code');
    const query = params.toString();
    window.history.replaceState({}, document.title, window.location.pathname + (query ? `?${query}` : ''));
  })();
  try {
    await callbackExchange;
  } finally {
    callbackExchange = null;
  }
}


