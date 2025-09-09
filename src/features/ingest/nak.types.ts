/**
 * Typdefinitionen für die NAK-JSON-Struktur
 * Basierend auf der Struktur von nakbuch_v5.4.0.json
 */

export interface NakDataset {
  version: string;                 // "5.4.0"
  buecher: NakBook[];
  lieder: NakLied[];
}

export interface NakBook {
  id: string;                      // z.B. "gb", "cb"
  title: string;                   // "Gesangbuch", ...
  hymnCount: number;
  group?: string;
  info?: string;
  rubrics: NakRubric[];            // thematische Rubriken
}

export interface NakRubric {
  buchId: string;                  // Buch-ID (z.B. "gb")
  index: number;                   // Rubrik-Index (Int)
  title: string;                   // Rubrik-Titel
  isMain: boolean;
}

export interface NakLink { 
  title: string; 
  url: string; 
}

export interface NakLied {
  buchId: string;                  // Buch-ID (z.B. "gb")
  nummer: number;                  // Liednummer im Buch
  rubricIndex: number;             // Rubrik-Index (Bezug auf Buchrubrik)
  title: string;                   // Liedtitel
  text: string;                    // Volltext mit Strophen & "/"-Zeilentrennern
  copyright?: string;
  taktart?: string;
  tonart?: string;
  startingPitches?: string;
  pdfPageIndex?: number;
  pdfPageCount?: number;
  links?: NakLink[];
}
