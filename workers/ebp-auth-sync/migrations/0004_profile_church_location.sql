ALTER TABLE users ADD COLUMN church_name TEXT;
ALTER TABLE users ADD COLUMN location TEXT;
ALTER TABLE users ADD COLUMN show_church_location INTEGER NOT NULL DEFAULT 0 CHECK(show_church_location IN (0,1));
