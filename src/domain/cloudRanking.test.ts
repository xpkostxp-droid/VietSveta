import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 'test-token' } } }) } }) }));
import { memberRequest } from './cloud';
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(async () => ({ ok:true, json:async()=>({ rows:[] }) }))); });
afterEach(() => { vi.unstubAllGlobals(); });
it.each(['lesson10-family','lesson11-house','lesson11-adjectives','lesson15-verbs'])('routes %s only to the dedicated authenticated read-only leaderboard', async game => {
 await memberRequest({action:'leaderboard',game});
 expect(fetch).toHaveBeenCalledWith('https://eqdlhipzjhbzfchwjazr.supabase.co/functions/v1/beginner-game-ranking',expect.objectContaining({method:'POST',headers:expect.objectContaining({Authorization:'Bearer test-token'}),body:JSON.stringify({action:'leaderboard',game})}));
});
it.each([{action:'leaderboard',game:'lesson7-countries'},{action:'login',id:'test',pin:'0000'},{action:'profile'},{action:'admin-overview'}])('preserves the existing endpoint for %j', async body => {
 await memberRequest(body);
 expect(fetch).toHaveBeenCalledWith('https://eqdlhipzjhbzfchwjazr.supabase.co/functions/v1/member-access',expect.anything());
});
