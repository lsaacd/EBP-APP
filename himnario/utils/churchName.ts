/**
 * Every church in the directory is an "IDDV El Buen Pastor" congregation, so
 * repeating that in each name is noise. Show what tells them apart instead:
 * "IDDV El Buen Pastor — Riverbank" → "Riverbank".
 *
 * The stored name is left untouched (profiles match on it); this only affects
 * what is displayed. Falls back to the city, then to the original name.
 */
const DENOMINATION_PREFIX =
  /^\s*(?:IDDV\s+)?(?:Iglesia\s+)?(?:El\s+)?Buen\s+Pastor\b\s*[—–\-:·,|/]*\s*/i;

export function churchDisplayName(name: string | null | undefined, city?: string | null): string {
  const original = (name ?? '').trim();
  const stripped = original.replace(DENOMINATION_PREFIX, '').trim();
  if (stripped) return stripped;
  return (city ?? '').trim() || original;
}
