-- Device Expo push tokens for lock-screen APNs/FCM delivery (Phase 2).
-- See guides/NOTIFICATIONS-PLAN.md.
CREATE TABLE IF NOT EXISTS push_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK(platform IN ('ios','android')),
  language TEXT NOT NULL DEFAULT 'es' CHECK(language IN ('es','en')),
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
