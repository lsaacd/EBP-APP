-- Separate consent for listing a member to signed-in visitors from other churches.
-- Existing same-church suggestion settings remain unchanged and do not imply this consent.
ALTER TABLE users ADD COLUMN directory_visible_to_all INTEGER NOT NULL DEFAULT 0 CHECK(directory_visible_to_all IN (0,1));
