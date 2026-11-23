-- Friends ("Hermanos"), phase 1: mutual friendships with a request step.
-- One row per pair of users, whichever direction the request went.
-- See guides/FRIENDS-PLAN.md.
CREATE TABLE IF NOT EXISTS friendships (
  user_low TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_high TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('pending','accepted')),
  created_at INTEGER NOT NULL,
  responded_at INTEGER,
  PRIMARY KEY(user_low, user_high),
  CHECK(user_low < user_high)
);
CREATE INDEX IF NOT EXISTS idx_friendships_high ON friendships(user_high, status);
