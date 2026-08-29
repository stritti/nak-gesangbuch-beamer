import type { NakDataset, NakLied, NakBook } from './nak.types';
import type { Song, Verse } from '@/features/songs/song.types';

/**
 * Parst den Liedtext in einzelne Strophen und Zeilen
 * @param text Volltext des Liedes mit Strophen und "/"-Zeilentrennern
 * @returns Array von Verse-Objekten mit id und lines
 */
export function parseTextToVerses(text: string): Verse[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();

  // Strophen anhand von Leerzeilen (\n\n) ODER Nummernpräfix ("1. ", "2. ", …) erkennen
  const blocks = normalized
    .split(/\n\s*\n+/) // Trennung durch Leerzeilen
    .flatMap(b => b.split(/\n(?=\d+\.\s)/)); // falls mehrere nummerierte Abschnitte ohne Leerzeile

  return blocks.map((block, i) => {
    // Prüfen, ob die Strophe mit einer Nummer beginnt (z.B. "1. ")
    const m = block.match(/^(\d+)\.\s*/);
    const id = m ? m[1] : String(i + 1);
    const cleaned = block.replace(/^\d+\.\s*/, '');

    // Zeilen sind oft mit " / " getrennt; zusätzlich hartzeilige Umbrüche zulassen
    const lines = cleaned
      .split(/\s*\/\s*|\n/)
      .map(s => s.trim())
      .filter(Boolean);

    return { id, lines };
  }).filter(v => v.lines.length > 0);
}

/**
 * Transformiert ein NAK-Lied in das interne Song-Modell
 * @param nak NAK-Lied aus der JSON-Datei
 * @param books Mapping von Buch-IDs zu Buch-Objekten
 * @returns Transformiertes Song-Objekt
 */
export function mapNakToSong(nak: NakLied, books: Record<string, NakBook>): Song {
  const book = books[nak.buchId];
  const rubric = book?.rubrics?.find(r => r.index === nak.rubricIndex)?.title;
  
  return {
    id: `${nak.buchId}-${String(nak.nummer)}`,
    number: String(nak.nummer),
    title: nak.title,
    verses: parseTextToVerses(nak.text),
    topics: rubric ? [rubric] : [],
    copyright: nak.copyright,
    source: {
      buchId: nak.buchId,
      rubric,
      nummer: nak.nummer,
      links: nak.links,
      meta: {
        taktart: nak.taktart,
        tonart: nak.tonart,
        startingPitches: nak.startingPitches,
        pdfPageIndex: nak.pdfPageIndex,
        pdfPageCount: nak.pdfPageCount
      }
    }
  };
}

/**
 * Transformiert ein NAK-Dataset in ein Array von Song-Objekten
 * @param dataset NAK-Dataset aus der JSON-Datei
 * @returns Array von transformierten Song-Objekten
 */
export function transformNakDataset(dataset: NakDataset): Song[] {
  // Erstelle ein Mapping von Buch-IDs zu Buch-Objekten für schnelleren Zugriff
  const books: Record<string, NakBook> = {};
  dataset.buecher.forEach(book => {
    books[book.id] = book;
  });

  // Transformiere jedes Lied
  return dataset.lieder.map(lied => mapNakToSong(lied, books));
}
