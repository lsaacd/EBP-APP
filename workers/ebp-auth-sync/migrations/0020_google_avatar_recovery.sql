-- Preserve verified Google OAuth photo URL so users can restore it after removal,
-- and record explicit avatar removals so subsequent Google sign-ins respect their choice.
ALTER TABLE users ADD COLUMN google_avatar_url TEXT;
ALTER TABLE users ADD COLUMN avatar_removed_at INTEGER;
