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
  otro: ["Otro coro", "Other choir"],
};
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
