import type { Song, Verse } from '@/features/songs/song.types';

/**
 * Baut den Slide-Stream für ein Lied gemäß verseOrder (inkl. Refrain 'R').
 * Leerer Song → leeres Array.
 */
export function buildSlides(song: Song | null): string[][] {
  if (!song) return [];

  const verseOrder = song.verseOrder || song.verses.map((v) => v.id);
  const slides: string[][] = [];

  for (const verseId of verseOrder) {
    let verse: Verse | undefined;
    if (verseId === 'R' && song.refrain) {
      verse = song.refrain;
    } else {
      verse = song.verses.find((v) => v.id === verseId);
    }
    if (!verse) continue;
    slides.push(verse.lines);
  }

  return slides;
}