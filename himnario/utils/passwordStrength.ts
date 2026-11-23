export type PasswordStrengthLevel = 0 | 1 | 2 | 3;

/**
 * Computes a simple 3-tier password strength indicator for registration UI:
 * - 0: empty
 * - 1: weak (< 8 chars)
 * - 2: good (8–11 chars with 1–2 character classes, or 8–9 chars with 3 classes)
 * - 3: strong (>= 12 chars, or >= 10 chars with 3+ classes, or >= 8 chars with all 4 classes)
 */
export function getPasswordStrength(password: string): PasswordStrengthLevel {
  if (!password) return 0;
  if (password.length < 8) return 1;
  let classes = 0;
  if (/[a-z]/.test(password)) classes += 1;
  if (/[A-Z]/.test(password)) classes += 1;
  if (/\d/.test(password)) classes += 1;
  if (/[^a-zA-Z0-9]/.test(password)) classes += 1;
  if (password.length >= 12 || (password.length >= 10 && classes >= 3) || classes >= 4) {
    return 3;
  }
  return 2;
}
