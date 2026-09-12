import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase scaffold (Phase 0).
 *
 * The app must keep working fully offline / unconfigured — solo play and the
 * persisted local save never depend on a backend. Everything network-facing
 * therefore funnels through the nullable `supabase` client below and the
 * `isSupabaseConfigured` flag; duel code (Phase 1) gates on that flag.
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        // Anonymous sessions live in localStorage so a refresh keeps the
        // same player identity (COPPA-friendly: a UUID, no PII).
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'slotword-auth',
      },
    })
  : null;

// In-flight dedupe: React StrictMode mounts effects twice in dev, and
// several components may ask for a session at once — share one promise.
let sessionPromise: Promise<string | null> | null = null;

/**
 * Returns the anonymous player's user id, signing in if needed.
 * Resolves `null` when Supabase isn't configured or the network fails —
 * callers must treat null as "offline / local-only mode".
 */
export function ensureAnonymousSession(): Promise<string | null> {
  if (!supabase) return Promise.resolve(null);

  if (!sessionPromise) {
    sessionPromise = (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) return data.session.user.id;

        const { data: signInData, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.warn('[supabase] anonymous sign-in failed:', error.message);
          sessionPromise = null; // allow a later retry
          return null;
        }
        return signInData.user?.id ?? null;
      } catch (err) {
        console.warn('[supabase] session unavailable:', err);
        sessionPromise = null;
        return null;
      }
    })();
  }
  return sessionPromise;
}
