-- Friends ("Hermanos"), phases 2 and 4: what a person shares.
-- See guides/FRIENDS-PLAN.md.

-- Accepted friends can see this person's favourite hymns. On by default:
-- accepting a friend is the consent; the switch turns it off.
ALTER TABLE users ADD COLUMN share_favorites_with_friends INTEGER NOT NULL DEFAULT 1 CHECK(share_favorites_with_friends IN (0,1));

-- Whether this person is suggested to others who linked the same verified
-- church. NULL means "not chosen yet", which follows show_church_location:
-- someone who hides their church is not revealed as a member until they opt in.
ALTER TABLE users ADD COLUMN suggest_to_church_members INTEGER CHECK(suggest_to_church_members IN (0,1));
