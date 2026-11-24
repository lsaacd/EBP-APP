-- Friends list visibility: signed-in members can view accepted friend names by
-- default; turning this off hides the names while keeping the count visible.
ALTER TABLE users ADD COLUMN show_friends_list INTEGER NOT NULL DEFAULT 1 CHECK(show_friends_list IN (0,1));
