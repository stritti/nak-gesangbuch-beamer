export type LanguageCode = 'de' | 'en' | 'fr' | 'it' | 'es' | string;

export interface Verse {
  id: string;      // "1", "2", "R" etc.
  lines: string[]; // reine Textzeilen (kein HTML)
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
  notes?: string;            // interne Hinweise
  createdAt?: string;        // ISO
  updatedAt?: string;        // ISO
}
