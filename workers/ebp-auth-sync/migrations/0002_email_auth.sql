-- Apply via `wrangler d1 migrations apply`, which records successful filenames
-- in d1_migrations and skips them on repeat deployments. SQLite has no
-- ALTER TABLE ADD COLUMN IF NOT EXISTS: do not replay this SQL manually.
ALTER TABLE users ADD COLUMN email_verified_at INTEGER;
CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('reset', 'verify')),
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_email_tokens_user_id ON email_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tokens_expires_at ON email_tokens(expires_at);
