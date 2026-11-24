CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  email_verified_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('reset', 'verify')),
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_email_tokens_user_id ON email_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tokens_expires_at ON email_tokens(expires_at);

CREATE TABLE IF NOT EXISTS user_data (
  user_id TEXT PRIMARY KEY,
  favorites_json TEXT NOT NULL DEFAULT '[]',
  playlists_json TEXT NOT NULL DEFAULT '[]',
  recents_json TEXT NOT NULL DEFAULT '[]',
  preferences_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL,
  blocked_until INTEGER NOT NULL DEFAULT 0
);


ALTER TABLE users ADD COLUMN ministry TEXT;
ALTER TABLE users ADD COLUMN choir TEXT;
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin'));
ALTER TABLE users ADD COLUMN badge_verified INTEGER NOT NULL DEFAULT 0 CHECK(badge_verified IN (0,1));
ALTER TABLE users ADD COLUMN suspended_at INTEGER;
ALTER TABLE users ADD COLUMN suspended_reason TEXT;
ALTER TABLE users ADD COLUMN ugc_terms_accepted_at INTEGER;
ALTER TABLE users ADD COLUMN church_name TEXT;
ALTER TABLE users ADD COLUMN location TEXT;
ALTER TABLE users ADD COLUMN show_church_location INTEGER NOT NULL DEFAULT 0 CHECK(show_church_location IN (0,1));

CREATE TABLE verse_stats (verse_id TEXT PRIMARY KEY, likes_count INTEGER NOT NULL DEFAULT 0, comments_count INTEGER NOT NULL DEFAULT 0, shares_count INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL);
CREATE TABLE verse_likes (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, verse_id TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY(user_id,verse_id));
CREATE TABLE verse_comments (
 id TEXT PRIMARY KEY, verse_id TEXT NOT NULL, parent_id TEXT REFERENCES verse_comments(id) ON DELETE CASCADE,
 user_id TEXT REFERENCES users(id) ON DELETE SET NULL, author_name_snapshot TEXT, body TEXT NOT NULL,
 created_at INTEGER NOT NULL, edited_at INTEGER, hidden_at INTEGER, hidden_by TEXT, client_request_id TEXT
);
CREATE INDEX idx_verse_comments_thread ON verse_comments(verse_id,hidden_at,created_at DESC,id DESC);
CREATE INDEX idx_verse_comments_parent ON verse_comments(parent_id,created_at DESC,id DESC);
CREATE UNIQUE INDEX idx_verse_comments_idempotency ON verse_comments(user_id,client_request_id) WHERE user_id IS NOT NULL AND client_request_id IS NOT NULL;
CREATE TABLE verse_comment_reports (
 id TEXT PRIMARY KEY, comment_id TEXT NOT NULL REFERENCES verse_comments(id) ON DELETE CASCADE,
 reporter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, reason TEXT NOT NULL, details TEXT,
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','dismissed')), created_at INTEGER NOT NULL, resolved_by TEXT, resolved_at INTEGER,
 UNIQUE(comment_id,reporter_user_id)
);
CREATE INDEX idx_verse_reports_status ON verse_comment_reports(status,created_at DESC);
CREATE TABLE user_blocks (blocker_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, blocked_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at INTEGER NOT NULL, PRIMARY KEY(blocker_user_id,blocked_user_id));
CREATE TABLE choir_repertoires (id TEXT PRIMARY KEY, choir TEXT NOT NULL, title TEXT NOT NULL, notes TEXT, hymn_ids_json TEXT NOT NULL DEFAULT '[]', updated_by TEXT, updated_at INTEGER NOT NULL);

-- Counters remain correct under concurrent requests, cascades, deletion and retries.
CREATE TRIGGER verse_like_insert AFTER INSERT ON verse_likes BEGIN
 INSERT INTO verse_stats(verse_id,updated_at) VALUES(NEW.verse_id,NEW.created_at) ON CONFLICT DO NOTHING;
 UPDATE verse_stats SET likes_count=(SELECT count(*) FROM verse_likes WHERE verse_id=NEW.verse_id),updated_at=NEW.created_at WHERE verse_id=NEW.verse_id;
END;
CREATE TRIGGER verse_like_delete AFTER DELETE ON verse_likes BEGIN
 UPDATE verse_stats SET likes_count=(SELECT count(*) FROM verse_likes WHERE verse_id=OLD.verse_id) WHERE verse_id=OLD.verse_id;
END;
CREATE TRIGGER verse_comment_insert AFTER INSERT ON verse_comments BEGIN
 INSERT INTO verse_stats(verse_id,updated_at) VALUES(NEW.verse_id,NEW.created_at) ON CONFLICT DO NOTHING;
 UPDATE verse_stats SET comments_count=(SELECT count(*) FROM verse_comments WHERE verse_id=NEW.verse_id AND hidden_at IS NULL),updated_at=NEW.created_at WHERE verse_id=NEW.verse_id;
END;
CREATE TRIGGER verse_comment_update AFTER UPDATE OF hidden_at ON verse_comments BEGIN
 UPDATE verse_stats SET comments_count=(SELECT count(*) FROM verse_comments WHERE verse_id=NEW.verse_id AND hidden_at IS NULL) WHERE verse_id=NEW.verse_id;
END;
CREATE TRIGGER verse_comment_delete AFTER DELETE ON verse_comments BEGIN
 UPDATE verse_stats SET comments_count=(SELECT count(*) FROM verse_comments WHERE verse_id=OLD.verse_id AND hidden_at IS NULL) WHERE verse_id=OLD.verse_id;
END;
CREATE TRIGGER only_obispo_verified_insert BEFORE INSERT ON users WHEN NEW.badge_verified=1 AND COALESCE(NEW.ministry,'')!='obispo' BEGIN SELECT RAISE(ABORT,'only_obispo_verified'); END;
CREATE TRIGGER only_obispo_verified_update BEFORE UPDATE ON users WHEN NEW.badge_verified=1 AND COALESCE(NEW.ministry,'')!='obispo' BEGIN SELECT RAISE(ABORT,'only_obispo_verified'); END;

-- No public endpoint can assign admin; only this existing mailbox owner is eligible.
UPDATE users SET role='admin' WHERE lower(email)='isaacduran167@gmail.com';
ALTER TABLE users ADD COLUMN church_id TEXT;

CREATE TABLE IF NOT EXISTS churches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pastor_name TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  service_times TEXT,
  contact_info TEXT,
  photo_url TEXT,
  photos_json TEXT NOT NULL DEFAULT '[]',
  verified INTEGER NOT NULL DEFAULT 0 CHECK(verified IN (0,1)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  submitted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  verified_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_churches_status_verified ON churches(status, verified);
CREATE INDEX IF NOT EXISTS idx_churches_country_state ON churches(country, state);

CREATE TABLE IF NOT EXISTS hymn_stats (
  hymn_id TEXT PRIMARY KEY,
  likes_count INTEGER NOT NULL DEFAULT 0,
  dislikes_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS hymn_reactions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hymn_id TEXT NOT NULL,
  reaction INTEGER NOT NULL CHECK(reaction IN (1, -1)),
  created_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, hymn_id)
);
CREATE INDEX IF NOT EXISTS idx_hymn_reactions_hymn ON hymn_reactions(hymn_id, reaction);
CREATE TRIGGER IF NOT EXISTS hymn_reaction_insert AFTER INSERT ON hymn_reactions BEGIN
  INSERT INTO hymn_stats(hymn_id, updated_at) VALUES(NEW.hymn_id, NEW.created_at) ON CONFLICT DO NOTHING;
  UPDATE hymn_stats
    SET likes_count = (SELECT count(*) FROM hymn_reactions WHERE hymn_id = NEW.hymn_id AND reaction = 1),
        dislikes_count = (SELECT count(*) FROM hymn_reactions WHERE hymn_id = NEW.hymn_id AND reaction = -1),
        updated_at = NEW.created_at
    WHERE hymn_id = NEW.hymn_id;
END;
CREATE TRIGGER IF NOT EXISTS hymn_reaction_update AFTER UPDATE OF reaction ON hymn_reactions BEGIN
  UPDATE hymn_stats
    SET likes_count = (SELECT count(*) FROM hymn_reactions WHERE hymn_id = NEW.hymn_id AND reaction = 1),
        dislikes_count = (SELECT count(*) FROM hymn_reactions WHERE hymn_id = NEW.hymn_id AND reaction = -1),
        updated_at = NEW.created_at
    WHERE hymn_id = NEW.hymn_id;
END;
CREATE TRIGGER IF NOT EXISTS hymn_reaction_delete AFTER DELETE ON hymn_reactions BEGIN
  UPDATE hymn_stats
    SET likes_count = (SELECT count(*) FROM hymn_reactions WHERE hymn_id = OLD.hymn_id AND reaction = 1),
        dislikes_count = (SELECT count(*) FROM hymn_reactions WHERE hymn_id = OLD.hymn_id AND reaction = -1)
    WHERE hymn_id = OLD.hymn_id;
END;

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

-- Friends ("Hermanos"), phases 2 and 4: what a person shares.
-- See guides/FRIENDS-PLAN.md.

-- Accepted friends can see this person's favourite hymns. On by default:
-- accepting a friend is the consent; the switch turns it off.
ALTER TABLE users ADD COLUMN share_favorites_with_friends INTEGER NOT NULL DEFAULT 1 CHECK(share_favorites_with_friends IN (0,1));

-- Whether this person is suggested to others who linked the same verified
-- church. NULL means "not chosen yet", which follows show_church_location:
-- someone who hides their church is not revealed as a member until they opt in.
ALTER TABLE users ADD COLUMN suggest_to_church_members INTEGER CHECK(suggest_to_church_members IN (0,1));

-- Friends ("Hermanos"), phase 3: a playlist sent to one friend.
-- It is a copy taken when it was sent, not a live link to the sender's list.
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

-- Likes on individual verse and hymn comments (and replies).
CREATE TABLE IF NOT EXISTS verse_comment_likes (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL REFERENCES verse_comments(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, comment_id)
);
CREATE INDEX IF NOT EXISTS idx_verse_comment_likes_comment ON verse_comment_likes(comment_id);

-- In-app notifications & per-category preferences (Phase 1).
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

-- Device Expo push tokens for lock-screen APNs/FCM delivery (Phase 2).
CREATE TABLE IF NOT EXISTS push_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK(platform IN ('ios','android')),
  language TEXT NOT NULL DEFAULT 'es' CHECK(language IN ('es','en')),
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);

-- Dynamic choir directory & member submissions with admin approval.
CREATE TABLE IF NOT EXISTS choirs (
  slug TEXT PRIMARY KEY,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  church_context TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  submitted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  approved_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_choirs_status ON choirs(status, created_at DESC);
INSERT OR IGNORE INTO choirs (slug, name_es, name_en, church_context, status, submitted_by, created_at, approved_at)
VALUES
  ('esmirna', 'Coro Esmirna', 'Esmirna Choir', NULL, 'approved', NULL, 1763820000000, 1763820000000),
  ('maranatha', 'Coro Maranatha', 'Maranatha Choir', NULL, 'approved', NULL, 1763820000000, 1763820000000),
  ('filadelfia', 'Coro Filadelfia', 'Filadelfia Choir', NULL, 'approved', NULL, 1763820000000, 1763820000000);

-- Visibility to signed-in visitors from other churches requires fresh consent.
ALTER TABLE users ADD COLUMN directory_visible_to_all INTEGER NOT NULL DEFAULT 0 CHECK(directory_visible_to_all IN (0,1));

-- Signed-in members can view accepted friend names by default; opt-out hides names.
ALTER TABLE users ADD COLUMN show_friends_list INTEGER NOT NULL DEFAULT 1 CHECK(show_friends_list IN (0,1));
