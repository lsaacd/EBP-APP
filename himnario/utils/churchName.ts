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

/**
 * The person leading a congregation is shown as "SDD" (Siervo de Dios) plus
 * how they were entered, e.g. "Hno Azael Tapia" → "SDD Hno Azael Tapia".
 * Older records that carry a title ("Pastor", "Co-Pastor", …) lose it.
 */
const LEADER_TITLE =
  /^\s*(?:SDD|S\.D\.D\.?|Siervo\s+de\s+Dios|Co-?\s?Pastor|Pastor|Pastora|Ministro|Ministra|Rev\.?|Reverendo)\b[\s.:,\-–—]*/i;

export function servantDisplayName(name: string | null | undefined): string {
  let rest = (name ?? '').trim();
  // Titles can be stacked ("SDD Pastor Juan"), so strip until none is left.
  for (let i = 0; i < 3 && LEADER_TITLE.test(rest); i++) rest = rest.replace(LEADER_TITLE, '').trim();
  return rest ? `SDD ${rest}` : '';
}
