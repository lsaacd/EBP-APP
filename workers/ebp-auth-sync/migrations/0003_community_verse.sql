ALTER TABLE users ADD COLUMN ministry TEXT;
ALTER TABLE users ADD COLUMN choir TEXT;
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin'));
ALTER TABLE users ADD COLUMN badge_verified INTEGER NOT NULL DEFAULT 0 CHECK(badge_verified IN (0,1));
ALTER TABLE users ADD COLUMN suspended_at INTEGER;
ALTER TABLE users ADD COLUMN suspended_reason TEXT;
ALTER TABLE users ADD COLUMN ugc_terms_accepted_at INTEGER;

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
CREATE TABLE choir_repertoires (id TEXT PRIMARY KEY, choir TEXT NOT NULL CHECK(choir IN ('esmirna','maranatha')), title TEXT NOT NULL, notes TEXT, hymn_ids_json TEXT NOT NULL DEFAULT '[]', updated_by TEXT, updated_at INTEGER NOT NULL);

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
