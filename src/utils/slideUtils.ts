/**
 * Hilfsfunktionen für die Erstellung und Verwaltung von Slides
 */

/**
 * Teilt einen Vers in mehrere Slides auf, wenn er zu viele Zeilen hat
 * @param verse Der Vers mit seinen Zeilen
 * @param maxLinesPerSlide Maximale Anzahl von Zeilen pro Slide
 * @returns Array von Slides (jeder Slide ist ein Array von Zeilen)
 */
export function splitVerseIntoSlides(lines: string[], maxLinesPerSlide: number): string[][] {
  if (!lines || lines.length === 0) return [];
  
  // Wenn der Vers weniger oder gleich viele Zeilen hat wie maxLinesPerSlide,
  // gib ihn als einzelnen Slide zurück
  if (lines.length <= maxLinesPerSlide) {
    return [lines];
  }
  
  // Teile den Vers in mehrere Slides auf
  const slides: string[][] = [];
  for (let i = 0; i < lines.length; i += maxLinesPerSlide) {
    slides.push(lines.slice(i, i + maxLinesPerSlide));
  }
  
  return slides;
}

/**
 * Erstellt Slides aus einem Array von Versen
 * @param verses Array von Versen (jeder Vers hat eine ID und ein Array von Zeilen)
 * @param maxLinesPerSlide Maximale Anzahl von Zeilen pro Slide
 * @returns Array von Slides (jeder Slide ist ein Array von Zeilen)
 */
export function createSlidesFromVerses(
  verses: Array<{ id: string; lines: string[] }>,
  maxLinesPerSlide: number = 4
): string[][] {
  if (!verses || verses.length === 0) return [];
  
  const slides: string[][] = [];
  
  for (const verse of verses) {
    // Teile den Vers in Slides auf, wenn er zu viele Zeilen hat
    const verseSlides = splitVerseIntoSlides(verse.lines, maxLinesPerSlide);
    
    // Füge die Slides zum Gesamtergebnis hinzu
    slides.push(...verseSlides);
  }
  
  return slides;
}
