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
