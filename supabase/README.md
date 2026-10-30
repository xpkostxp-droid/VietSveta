# VietSveta server

Singapore Free project, identifiers in project.json. No secret/service keys, PINs, or bootstrap secrets are committed.

## Authentication

Five students plus Konstantin (administrator) are linked to Supabase Auth users. The member-access Edge Function checks four-digit PINs through a service-only RPC, with bcrypt hashing and an atomic account lock after five incorrect attempts for 15 minutes. It exchanges a verified PIN for a Supabase Auth session using a separate random 96-character password stored only in the unexposed app_private schema. Clients never receive the Auth password. The browser persists and automatically refreshes the Auth session.

All privileged Edge Function actions verify the current Auth user and active membership. Administrative access is taken from the server participants.is_admin field, never user metadata or request data. There is no public account-creation/provisioning endpoint. General Auth signups, even if enabled in the provider dashboard, cannot access application data without a server-assigned roster membership.

## Progress and test scores

Browser storage is namespaced by authenticated UUID. Legacy guest statistics are removed once and never imported. Offline changes stay in the account namespace and retry on reconnect. sync_learning_state merges per-key timestamped changes under a row lock; simultaneous edits to the same storage key use the latest timestamp, rather than summing counters. Use one active device per participant for consistent counters during this pilot.

The game_attempts table stores idempotent directional-round attempts (30/48/40). Reviews remain local to the learning snapshot. RLS limits students and admin clients to their own progress and game attempts. The admin-overview Edge action can inspect all six users. The leaderboard action filters participants.is_admin=false on the server; test attempts can never enter student prize places. No leaderboard page has been restored.

## Security checks

- Six PIN logins and persisted-session refresh checked against the running service.
- Wrong PINs lock the account; checking is unavailable through the client-facing database API.
- Cross-user reads/writes and student calls to administrator actions are denied.
- Admin score excluded from all five-player leaderboard responses.
- No direct client access to credentials; RLS on all data tables.
- Supabase's optional leaked-password check may be unavailable on Free; the actual Auth passwords are generated high-entropy secrets, while short PINs have a separate server rate limit.

schema.sql and auth_setup.sql are applied schema snapshots, not SQL to reapply blindly. Credentials are provisioned separately through authorized database administration and are not in these files. PINs can be changed from the administrator profile. Account access should be disabled server-side when removing a participant.

## Online battles

`battle_online.sql` upgrades the existing battle schema after `battle_word_cycles.sql` and `battle_statistics.sql`. It opens Battle and its standings to every active roster member; unauthenticated and non-member calls remain denied. Private tables have no direct client grants.

New `fruits`, `vegetables`, and `harvest` matches use the ninja arena: up to 10 image-to-Vietnamese questions (9 for vegetables), then sudden death. Other topics retain the two-direction pickleball rules. Existing matches default to pickleball for compatibility. The server persists both characters per match using roster gender, excludes identical characters for same-gender opponents, and sends each client the same timing and result. A wrong answer leaves the opponent the remaining time. Ninja rounds award at most one point; equal elapsed answers use server receipt order. All finished, non-tied human matches use the existing battle statistics and rematch RPCs. Bot entry points are removed from the app.

`tests/battle_online.integration.sql` exercises all active profiles, ninja topics, pickleball, readiness, wrong/correct answers, timeout, overtime, standings, rematch, and non-member rejection in a rolled-back transaction. Run only through the authorized admin connection; it does not retain simulated matches.
