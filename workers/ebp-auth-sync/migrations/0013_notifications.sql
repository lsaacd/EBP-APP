-- In-app notifications & per-category preferences (Phase 1).
-- See guides/NOTIFICATIONS-PLAN.md.
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('comment_like','comment_reply','friend_request','friend_accepted','shared_playlist')),
  target_id TEXT NOT NULL,
  context_id TEXT,
  preview TEXT,
  created_at INTEGER NOT NULL,
  read_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe
  ON notifications(user_id, actor_id, type, target_id)
  WHERE actor_id IS NOT NULL;

ALTER TABLE users ADD COLUMN notify_comment_likes INTEGER NOT NULL DEFAULT 1 CHECK(notify_comment_likes IN (0,1));
ALTER TABLE users ADD COLUMN notify_comment_replies INTEGER NOT NULL DEFAULT 1 CHECK(notify_comment_replies IN (0,1));
ALTER TABLE users ADD COLUMN notify_friends INTEGER NOT NULL DEFAULT 1 CHECK(notify_friends IN (0,1));
