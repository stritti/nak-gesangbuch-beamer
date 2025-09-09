import { ref } from 'vue';
import type { NakDataset } from './nak.types';
import type { Song } from '@/features/songs/song.types';
import { transformNakDataset } from './nak.parser';
import * as idb from '@/utils/idb';
import { readFileAsText } from '@/utils/file';

/**
 * Repository für den Import, die Validierung und Persistenz von NAK-Daten
 */
export class NakRepository {
  // Reaktive Zustände für UI-Feedback
  public isImporting = ref(false);
  public importProgress = ref(0);
  public importErrors = ref<Array<{ path: string; message: string }>>([]);

  constructor() {
    // Keine AJV-Initialisierung mehr
  }

  /**
   * Importiert und validiert eine NAK-JSON-Datei
   * @param file Die zu importierende JSON-Datei
   * @returns Die validierten und transformierten Songs
   */
  async importNakFile(file: File): Promise<{ 
    songs: Song[]; 
    version: string; 
    errors: Array<{ path: string; message: string }> 
  }> {
    this.isImporting.value = true;
    this.importProgress.value = 0;
    this.importErrors.value = [];

    try {
      // Datei einlesen
      const content = await readFileAsText(file);
      this.importProgress.value = 20;

      // JSON parsen
      let nakData: NakDataset;
      try {
        nakData = JSON.parse(content) as NakDataset;
      } catch (error) {
        throw new Error(`Die Datei enthält kein gültiges JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
      this.importProgress.value = 40;

      // Einfache Validierung ohne AJV
      if (!nakData.version || !nakData.buecher || !nakData.lieder) {
        throw new Error('Die Datei enthält nicht die erforderlichen Felder (version, buecher, lieder)');
      }
      
      if (!Array.isArray(nakData.buecher) || !Array.isArray(nakData.lieder)) {
        throw new Error('Die Felder "buecher" und "lieder" müssen Arrays sein');
      }
      
      // Prüfe, ob die Version mit 5.x.y beginnt
      if (!/^5\.\d+\.\d+$/.test(nakData.version)) {
        throw new Error(`Ungültige Version: ${nakData.version} (erwartet: 5.x.y)`);
      }
      
      // Einfache Validierung der ersten paar Lieder (max. 10 Fehler)
      const errors: Array<{ path: string; message: string }> = [];
      
      for (let i = 0; i < Math.min(10, nakData.lieder.length); i++) {
        const lied = nakData.lieder[i];
        if (!lied.buchId) {
          errors.push({ path: `/lieder/${i}`, message: 'Feld "buchId" fehlt' });
        }
        if (!lied.nummer) {
          errors.push({ path: `/lieder/${i}`, message: 'Feld "nummer" fehlt' });
        }
        if (!lied.title) {
          errors.push({ path: `/lieder/${i}`, message: 'Feld "title" fehlt' });
        }
        if (!lied.text) {
          errors.push({ path: `/lieder/${i}`, message: 'Feld "text" fehlt' });
        }
        
        if (errors.length >= 10) break;
      }
      
      if (errors.length > 0) {
        this.importErrors.value = errors;
        throw new Error(`Die Datei entspricht nicht dem NAK-Schema (${errors.length} Fehler)`);
      }
      
      this.importProgress.value = 60;

      // Daten transformieren
      const songs = transformNakDataset(nakData as NakDataset);
      this.importProgress.value = 80;

      // In IndexedDB speichern
      await this.saveSongs(songs);
      this.importProgress.value = 100;

      return {
        songs,
        version: nakData.version,
        errors: this.importErrors.value
      };
    } finally {
      this.isImporting.value = false;
    }
  }

  /**
   * Speichert Songs in der IndexedDB
   * @param songs Die zu speichernden Songs
   */
  private async saveSongs(songs: Song[]): Promise<void> {
    // Zuerst alle vorhandenen Songs löschen
    await idb.clear('songs');
    
    // Dann neue Songs speichern
    await idb.setMany('songs', songs);
    
    console.log(`${songs.length} Lieder erfolgreich in IndexedDB gespeichert`);
  }

  /**
   * Sucht nach Songs basierend auf einer Suchanfrage
   * @param query Die Suchanfrage
   * @param filters Optionale Filter (buchId, rubric)
   * @returns Die gefundenen Songs
   */
  async searchSongs(
    query: string, 
    filters?: { buchId?: string; rubric?: string }
  ): Promise<Song[]> {
    // Alle Songs aus IndexedDB laden
    const allSongs = await idb.getAll<Song>('songs');
    
    // Wenn keine Suchanfrage und keine Filter, alle Songs zurückgeben
    if (!query.trim() && (!filters || (!filters.buchId && !filters.rubric))) {
      return this.sortSongsByNumber(allSongs);
    }
    
    // Suchanfrage normalisieren
    const normalizedQuery = query.trim().toLowerCase();
    
    // Filtern nach Suchanfrage und Filtern
    const filteredSongs = allSongs.filter(song => {
      // Nach Buch-ID filtern
      if (filters?.buchId && song.source?.buchId !== filters.buchId) {
        return false;
      }
      
      // Nach Rubrik filtern
      if (filters?.rubric && song.source?.rubric !== filters.rubric) {
        return false;
      }
      
      // Wenn keine Suchanfrage, nur nach Filtern filtern
      if (!normalizedQuery) {
        return true;
      }
      
      // Nach Titel suchen
      if (song.title.toLowerCase().includes(normalizedQuery)) {
        return true;
      }
      
      // Nach Nummer suchen
      if (song.number && song.number.includes(normalizedQuery)) {
        return true;
      }
      
      // Nach Volltext suchen
      return song.verses.some(verse => 
        verse.lines.some(line => 
          line.toLowerCase().includes(normalizedQuery)
        )
      );
    });
    
    // Sortiere die gefilterten Ergebnisse
    return this.sortSongsByNumber(filteredSongs);
  }

  /**
   * Sortiert Songs nach Buch-ID und Nummer
   * @param songs Die zu sortierenden Songs
   * @returns Sortierte Songs
   */
  private sortSongsByNumber(songs: Song[]): Song[] {
    return [...songs].sort((a, b) => {
      // Zuerst nach Buch-ID sortieren
      if (a.source?.buchId !== b.source?.buchId) {
        return (a.source?.buchId || '').localeCompare(b.source?.buchId || '');
      }
      
      // Dann nach Nummer sortieren (als Zahl, nicht als String)
      const numA = a.number ? parseInt(a.number, 10) : 0;
      const numB = b.number ? parseInt(b.number, 10) : 0;
      return numA - numB;
    });
  }

  /**
   * Lädt alle Bücher aus den gespeicherten Songs
   * @returns Ein Array von Buch-Objekten mit ID, Titel und Anzahl der Lieder
   */
  async getBooks(): Promise<Array<{ id: string; title: string; count: number }>> {
    const songs = await idb.getAll<Song>('songs');
    
    // Bücher gruppieren und zählen
    const bookMap = new Map<string, { id: string; title: string; count: number }>();
    
    for (const song of songs) {
      if (song.source?.buchId) {
        const buchId = song.source.buchId;
        
        if (!bookMap.has(buchId)) {
          // Titel aus dem ersten Lied mit dieser Buch-ID extrahieren
          // In einer echten Anwendung würde man die Buchtitel separat speichern
          bookMap.set(buchId, {
            id: buchId,
            title: `${buchId.toUpperCase()}`,  // Fallback
            count: 1
          });
        } else {
          const book = bookMap.get(buchId)!;
          book.count++;
        }
      }
    }
    
    return Array.from(bookMap.values());
  }

  /**
   * Lädt alle Rubriken für ein bestimmtes Buch
   * @param buchId Die ID des Buches
   * @returns Ein Array von Rubriken
   */
  async getRubrics(buchId: string): Promise<string[]> {
    const songs = await idb.getAll<Song>('songs');
    
    // Rubriken für das angegebene Buch sammeln
    const rubrics = new Set<string>();
    
    for (const song of songs) {
      if (song.source?.buchId === buchId && song.source.rubric) {
        rubrics.add(song.source.rubric);
      }
    }
    
    return Array.from(rubrics).sort();
  }
}

// Singleton-Instanz exportieren
export const nakRepository = new NakRepository();
