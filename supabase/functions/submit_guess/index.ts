/**
 * submit_guess — the only Edge Function in the duel backend.
 *
 * Why an Edge Function at all? The color-state algorithm (two-pass letter
 * matching) is ported verbatim from the proven src/types.ts implementation;
 * keeping it in TypeScript (instead of rewriting it in PL/pgSQL) guarantees
 * zero logic drift with solo mode. All *state mutation* is delegated to the
 * `apply_guess` Postgres function, which re-validates and locks rows, so
 * races are impossible even if two guesses arrive simultaneously.
 *
 * Flow: verify caller JWT → verify participant → read secret (service role)
 *       → compute colors → rpc apply_guess → return the fresh duel state.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { calculateLetterStates } from '../_shared/rules.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method-not-allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    // 1. Authenticate the caller from their Authorization header.
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: 'unauthorized' }, 401);

    // 2. Parse + shape the request.
    const body = await req.json().catch(() => null);
    const duelId = typeof body?.duel_id === 'string' ? body.duel_id : null;
    const guess = String(body?.guess ?? '').trim().toUpperCase();
    if (!duelId || !guess) return json({ error: 'bad-request' }, 400);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // 3. Verify the caller is a participant of an active duel BEFORE
    //    touching the secret (never compute colors for a stranger).
    const { data: duelRow } = await admin
      .from('duels')
      .select('id, status, word_length')
      .eq('id', duelId)
      .single();
    if (!duelRow) return json({ error: 'not-found' }, 404);
    if (duelRow.status !== 'active') return json({ error: 'not-active' }, 409);
    if (guess.length !== duelRow.word_length) return json({ error: 'bad-length' }, 400);

    const { data: membership } = await admin
      .from('duel_players')
      .select('player_id')
      .eq('duel_id', duelId)
      .eq('player_id', user.id)
      .maybeSingle();
    if (!membership) return json({ error: 'not-in-duel' }, 403);

    // 4. Read the secret (service role only) and compute colors.
    const { data: secretRow } = await admin
      .from('duel_secrets')
      .select('secret_word')
      .eq('duel_id', duelId)
      .single();
    if (!secretRow) return json({ error: 'not-found' }, 404);
    const secret = secretRow.secret_word as string;

    const colors = calculateLetterStates(guess, secret);
    const isSolved = guess === secret;

    // 5. Atomically apply the guess (validates word bank, attempts, status;
    //    settles + awards when the duel completes).
    const { data: state, error: rpcError } = await admin.rpc('apply_guess', {
      p_duel_id: duelId,
      p_player_id: user.id,
      p_guess: guess,
      p_colors: colors,
      p_is_solved: isSolved,
    });
    if (rpcError) {
      console.error('[submit_guess] apply_guess failed:', rpcError.message);
      return json({ error: 'server-error' }, 500);
    }

    return json(state ?? { error: 'unknown' }, 200);
  } catch (err) {
    console.error('[submit_guess] unexpected:', err);
    return json({ error: 'bad-request' }, 400);
  }
});
