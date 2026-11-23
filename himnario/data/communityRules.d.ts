export const MINISTRIES: Record<string, [string, string]>;
export const CHOIRS: Record<string, [string, string]>;
export function choirDisplayName(
  slug: string | null | undefined,
  es?: boolean,
  dynamicBySlug?: Record<string, [string, string] | { nameEs: string; nameEn: string }> | null,
): string;
export function wordCount(text: string): number;
export function normalizeComment(text: string): string;
