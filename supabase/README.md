# VietSveta server

Free Supabase project in Singapore. See project.json for public project identifiers; no secrets belong in this repository.

## Current state

- participants: five roster entries, not yet linked to Auth users.
- learning_state: per-user JSON progress snapshot, revision reserved for optimistic concurrency.
- game_attempts: directional totals 30, 48, and 40; correct-answer milliseconds.
- RLS enabled on all tables. Anonymous access revoked. Active members can access only their own rows. Client role cannot change membership or assign identities.
- No PIN credentials, Auth users, administrator access, sign-in UI, or browser synchronization enabled yet. Existing site remains unchanged.

## Verification

Transactional tests with two temporary Auth users verified own reads/writes and denied cross-user reads/updates/inserts; all fixtures rolled back. Supabase security advisor returned no findings.

## Next integration

Use server-side rate-limited four-digit PIN verification with Supabase Auth sessions; never put PINs, service keys, or an administrator secret in frontend code. Create the administrator separately with a strong credential. Link roster records server-side. Disable public signup. Verify account separation, session refresh, sign-out, disabled accounts, and offline progress synchronization before gating the existing application. Preserve local guest progress separately and offer explicit import rather than assigning it automatically to the first login.
