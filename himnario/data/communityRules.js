// Shared wire values and validation; no credentials or platform dependencies.
export const MINISTRIES = {
  obispo: ["Obispo", "Bishop"],
  pastor: ["Pastor", "Pastor"],
  coadjutor: ["Coadjutor", "Co-Pastor"],
  diacono: ["Diácono", "Deacon"],
  diaconisa: ["Diaconisa", "Deaconess"],
  obrero: ["Obrero(a)", "Church Worker"],
  evangelizante: ["Evangelizante", "Evangelist"],
  secretario: ["Secretario(a)", "Local Secretary"],
  tesorero: ["Tesorero(a)", "Local Treasurer"],
  instructor: ["Instructor(a)", "Instructor"],
  director: ["Director(a)", "Director"],
  lider_juvenil: ["Líder Juvenil", "Youth Leader"],
  director_coro: ["Director(a) de Coro", "Choir Director"],
  corista: ["Corista", "Choir Member"],
  hermano: ["Hermano en Cristo", "Brother in Christ"],
  hermana: ["Hermana en Cristo", "Sister in Christ"],
};
export const CHOIRS = {
  esmirna: ["Coro Esmirna", "Esmirna Choir"],
  maranatha: ["Coro Maranatha", "Maranatha Choir"],
  filadelfia: ["Coro Filadelfia", "Filadelfia Choir"],
  otro: ["Otro coro", "Other choir"],
};
export function choirDisplayName(slug, es = true, dynamicBySlug = null) {
  if (!slug || typeof slug !== "string") return "";
  if (dynamicBySlug && Object.prototype.hasOwnProperty.call(dynamicBySlug, slug)) {
    const entry = dynamicBySlug[slug];
    if (Array.isArray(entry)) return entry[es ? 0 : 1] || entry[0] || "";
    if (entry && typeof entry === "object") {
      return (es ? entry.nameEs : entry.nameEn) || entry.nameEs || entry.nameEn || "";
    }
  }
  if (Object.prototype.hasOwnProperty.call(CHOIRS, slug)) {
    return CHOIRS[slug][es ? 0 : 1];
  }
  const pretty = slug
    .replace(/^coro[_-]+/i, "")
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  if (!pretty) return "";
  return es ? `Coro ${pretty}` : `${pretty} Choir`;
}
export const wordCount = (text) =>
  text.trim().split(/\s+/u).filter(Boolean).length;
export function normalizeComment(text) {
  if (typeof text !== "string") throw new Error("invalid_comment");
  const body = text
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!body || body.length > 1000 || wordCount(body) > 100)
    throw new Error("comment_limit");
  // Plain text, no external promotion links or invisible control sequences.
  if (
    /<[^>]*>|https?:|www\.|[\u0000-\u0008\u000b\u000c\u000e-\u001f\u202a-\u202e\u2066-\u2069]/iu.test(
      body,
    )
  )
    throw new Error("comment_content");
  // Deliberately small baseline filter, supplemented by reports and human review.
  if (/\b(fuck|shit|puta|puto|mierda|kill yourself)\b/iu.test(body))
    throw new Error("comment_content");
  return body;
}
