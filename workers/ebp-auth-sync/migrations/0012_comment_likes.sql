-- Likes on individual verse and hymn comments (and replies).
CREATE TABLE IF NOT EXISTS verse_comment_likes (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL REFERENCES verse_comments(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, comment_id)
);
CREATE INDEX IF NOT EXISTS idx_verse_comment_likes_comment ON verse_comment_likes(comment_id);
