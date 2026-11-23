-- Friends ("Hermanos"), phase 3: a playlist sent to one friend.
-- It is a copy taken when it was sent, not a live link to the sender's list.
-- See guides/FRIENDS-PLAN.md.
CREATE TABLE IF NOT EXISTS shared_playlists (
  id TEXT PRIMARY KEY,
  from_user TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hymn_ids_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  seen_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_shared_playlists_to ON shared_playlists(to_user, created_at DESC);
