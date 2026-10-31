import { createClient } from 'npm:@supabase/supabase-js@2.95.0';
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
const cors = { 'Access-Control-Allow-Origin': 'https://xpkostxp-droid.github.io', 'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Vary': 'Origin', 'Cache-Control': 'no-store' };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
// Read-only endpoint for explicitly allowed games. Authentication is verified with getUser below.
// It has no login, PIN, roster, profile-update or administrator actions.
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'method' }, 405);
  try {
    if (Number(req.headers.get('content-length') ?? 0) > 12000) return reply({ error: 'size' }, 413);
    const text = await req.text();
    if (text.length > 12000) return reply({ error: 'size' }, 413);
    const body = JSON.parse(text);
    const token = req.headers.get('Authorization')?.replace(/^Bearer /i, '');
    if (!token) return reply({ error: 'Войди в приложение' }, 401);
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return reply({ error: 'Войди снова' }, 401);
    const { data: profile, error: profileError } = await admin.from('participants').select('id').eq('user_id', user.id).eq('active', true).single();
    if (profileError || !profile) return reply({ error: 'Учётная запись отключена' }, 403);
    if (body.action !== 'leaderboard' || !['lesson10-family', 'lesson11-house', 'lesson11-adjectives', 'lesson15-verbs'].includes(body.game)) return reply({ error: 'game' }, 400);
    const { data: players, error: playersError } = await admin.from('participants').select('id,display_name,user_id,ranking_since').eq('active', true).eq('is_admin', false);
    if (playersError) throw playersError;
    const rows = await Promise.all((players ?? []).map(async p => {
      const { data, error } = await admin.from('game_attempts').select('correct,correct_time_ms').eq('game', body.game).eq('user_id', p.user_id).gte('created_at', p.ranking_since ?? '1970-01-01T00:00:00Z').order('correct', { ascending: false }).order('correct_time_ms').limit(1);
      if (error) throw error;
      return { id: p.id, name: p.display_name, best: data?.[0] ?? null };
    }));
    rows.sort((a, b) => !a.best ? (b.best ? 1 : 0) : !b.best ? -1 : b.best.correct - a.best.correct || a.best.correct_time_ms - b.best.correct_time_ms);
    return reply({ rows });
  } catch { return reply({ error: 'Рейтинг временно недоступен. Попробуй ещё раз.' }, 500); }
});
