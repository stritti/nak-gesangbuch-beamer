export type LanguageCode = 'de' | 'en' | 'fr' | 'it' | 'es' | string;

export interface Verse {
  id: string;      // "1", "2", "R" etc.
  lines: string[]; // reine Textzeilen (kein HTML)
}

export interface SongSource {
  buchId: string;
  rubric?: string;
  nummer: number;
  links?: { title: string; url: string }[];
  meta?: {
    taktart?: string;
    tonart?: string;
    startingPitches?: string;
    pdfPageIndex?: number;
    pdfPageCount?: number;
  };
}

export interface Song {
  id: string;                // stable UUID/Slug
  number?: string;           // Gesangbuch-Nummer
  title: string;
  subtitle?: string;
  language?: LanguageCode;
  authors?: string[];        // Text/Melodie
  topics?: string[];         // Schlagworte (z.B. Abendmahl, Dank)
  copyright?: string;
  ccli?: string;             // falls vorhanden
  verses: Verse[];           // "refrain" kann in verseOrder referenziert werden
  refrain?: Verse;           // optionaler Kehrvers (id "R")
  verseOrder?: string[];     // z.B. ["1","R","2","R"]
  source?: SongSource;       // NAK-Quellbezug (Buch, Rubrik, Metadaten)
  notes?: string;            // interne Hinweise
  createdAt?: string;        // ISO
  updatedAt?: string;        // ISO
}
