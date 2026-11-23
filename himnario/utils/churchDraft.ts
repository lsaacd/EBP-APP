export interface ChurchFormSnapshot {
  name: string;
  pastor: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal: string;
  coordsInput: string;
  photos: string[];
  photoUrl: string;
  schedule: string;
  contact: string;
}

/**
 * Returns true if the Add/Edit Church form has unsaved user edits that would
 * be lost if the sheet is dismissed.
 * - For a new church: true when any input is non-empty (or country was changed
 *   away from the default).
 * - For editing an existing church: true only when at least one field differs
 *   from the initial snapshot loaded when the edit modal opened.
 */
export function hasUnsavedChurchDraft(
  current: ChurchFormSnapshot,
  initial: ChurchFormSnapshot | null,
  defaultCountry: string,
): boolean {
  const norm = (s: string) => s.trim();
  const samePhotos = (a: string[], b: string[]) =>
    a.length === b.length && a.every((item, idx) => item === b[idx]);

  if (!initial) {
    return (
      norm(current.name).length > 0 ||
      norm(current.pastor).length > 0 ||
      norm(current.address).length > 0 ||
      norm(current.city).length > 0 ||
      norm(current.state).length > 0 ||
      (norm(current.country).length > 0 && norm(current.country) !== norm(defaultCountry)) ||
      norm(current.postal).length > 0 ||
      norm(current.coordsInput).length > 0 ||
      current.photos.length > 0 ||
      norm(current.photoUrl).length > 0 ||
      norm(current.schedule).length > 0 ||
      norm(current.contact).length > 0
    );
  }

  return (
    norm(current.name) !== norm(initial.name) ||
    norm(current.pastor) !== norm(initial.pastor) ||
    norm(current.address) !== norm(initial.address) ||
    norm(current.city) !== norm(initial.city) ||
    norm(current.state) !== norm(initial.state) ||
    norm(current.country) !== norm(initial.country) ||
    norm(current.postal) !== norm(initial.postal) ||
    norm(current.coordsInput) !== norm(initial.coordsInput) ||
    !samePhotos(current.photos, initial.photos) ||
    norm(current.photoUrl) !== norm(initial.photoUrl) ||
    norm(current.schedule) !== norm(initial.schedule) ||
    norm(current.contact) !== norm(initial.contact)
  );
}
