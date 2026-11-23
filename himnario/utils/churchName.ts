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
 * The person leading a congregation is entered as a plain name ("Azael
 * Tapia") and shown as "SDD Hno Azael Tapia": SDD (Siervo de Dios) and Hno are
 * added for display. Older records that carry a title ("Pastor",
 * "Co-Pastor", "Hno") lose it first; a record entered as "Hna" keeps Hna.
 */
const LEADER_TITLE =
  /^\s*(?:SDD|S\.D\.D\.?|Siervo\s+de\s+Dios|Sierva\s+de\s+Dios|Co-?\s?Pastor|Pastor|Pastora|Ministro|Ministra|Rev\.?|Reverendo)\b[\s.:,\-–—]*/i;
const SIBLING_TITLE = /^\s*(Hno|Hna|Hermano|Hermana)\b[\s.:,\-–—]*/i;

function splitServant(name: string | null | undefined): { bare: string; sister: boolean } {
  let rest = (name ?? '').trim();
  let sister = false;
  // Titles can be stacked ("SDD Pastor Hno Juan"), so strip until none is left.
  for (let i = 0; i < 4; i++) {
    if (LEADER_TITLE.test(rest)) {
      rest = rest.replace(LEADER_TITLE, '').trim();
      continue;
    }
    const sibling = SIBLING_TITLE.exec(rest);
    if (!sibling) break;
    sister = /^(hna|hermana)$/i.test(sibling[1]);
    rest = rest.replace(SIBLING_TITLE, '').trim();
  }
  return { bare: rest, sister };
}

/** Just the name, for the form field: "Hno Azael Tapia" → "Azael Tapia". */
export function servantBareName(name: string | null | undefined): string {
  return splitServant(name).bare;
}

export function servantDisplayName(name: string | null | undefined): string {
  const { bare, sister } = splitServant(name);
  return bare ? `SDD ${sister ? 'Hna' : 'Hno'} ${bare}` : '';
}
