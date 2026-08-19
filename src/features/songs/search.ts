import type { Song } from './song.types';

/**
 * Sortiert Songs nach Buch-ID und Nummer (als Zahl, nicht als String).
 */
export function sortSongsByNumber(songs: Song[]): Song[] {
  return [...songs].sort((a, b) => {
    if (a.source?.buchId !== b.source?.buchId) {
      return (a.source?.buchId || '').localeCompare(b.source?.buchId || '');
    }
    const numA = a.number ? parseInt(a.number, 10) : 0;
    const numB = b.number ? parseInt(b.number, 10) : 0;
    return numA - numB;
  });
}

/**
 * Filtert Songs nach Suchanfrage (Titel, Nummer, Themen, Volltext, Refrain)
 * und optionalen Filtern (buchId, rubric). Ergebnis ist nach Buch-ID und Nummer sortiert.
 */
export function searchSongs(
  songs: Song[],
  query: string,
  filters?: { buchId?: string; rubric?: string }
): Song[] {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = songs.filter((song) => {
    if (filters?.buchId && song.source?.buchId !== filters.buchId) return false;
    if (filters?.rubric && song.source?.rubric !== filters.rubric) return false;
    if (!normalizedQuery) return true;
    if (song.title.toLowerCase().includes(normalizedQuery)) return true;
    if (song.number && song.number.includes(normalizedQuery)) return true;
    if (song.topics?.some((t) => t.toLowerCase().includes(normalizedQuery))) return true;
    if (song.verses.some((v) => v.lines.some((l) => l.toLowerCase().includes(normalizedQuery)))) return true;
    if (song.refrain?.lines.some((l) => l.toLowerCase().includes(normalizedQuery))) return true;
    return false;
  });
  return sortSongsByNumber(filtered);
}
