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

-- Relax the legacy 2-choir CHECK constraint on choir_repertoires so Filadelfia
-- and any admin-approved choir can also have pinned repertoires.
CREATE TABLE IF NOT EXISTS choir_repertoires_next (
  id TEXT PRIMARY KEY,
  choir TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  hymn_ids_json TEXT NOT NULL DEFAULT '[]',
  updated_by TEXT,
  updated_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO choir_repertoires_next (id, choir, title, notes, hymn_ids_json, updated_by, updated_at)
SELECT id, choir, title, notes, hymn_ids_json, updated_by, updated_at FROM choir_repertoires;
DROP TABLE choir_repertoires;
ALTER TABLE choir_repertoires_next RENAME TO choir_repertoires;
