const BOOK_NAMES: Record<string, string> = {
  'gb': 'Gesangbuch',
  'cb': 'Chorbuch',
  'jl': 'Jugendliederbuch',
  'kl': 'Kinderliederbuch'
};

/**
 * Ermittelt den Anzeigenamen eines Buches aus seiner Buch-ID.
 * @param buchId ID des Buches (z. B. 'gb')
 * @returns Anzeigename oder die ID in Großbuchstaben
 */
export function getBookName(buchId: string): string {
  return BOOK_NAMES[buchId] || buchId.toUpperCase();
}