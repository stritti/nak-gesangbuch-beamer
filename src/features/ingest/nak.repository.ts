import { ref } from 'vue';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { NakDataset } from './nak.types';
import type { Song } from '@/features/songs/song.types';
import { transformNakDataset } from './nak.parser';
import * as idb from '@/utils/idb';
import { readFileAsText } from '@/utils/file';

// JSON-Schema importieren
import nakSchema from './nak.schema.json';

/**
 * Repository für den Import, die Validierung und Persistenz von NAK-Daten
 */
export class NakRepository {
  // Reaktive Zustände für UI-Feedback
  public isImporting = ref(false);
  public importProgress = ref(0);
  public importErrors = ref<Array<{ path: string; message: string }>>([]);
  
  private ajv: Ajv;

  constructor() {
    // AJV für Schema-Validierung initialisieren
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.ajv.compile(nakSchema);
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
      let nakData: any;
      try {
        nakData = JSON.parse(content);
      } catch (error) {
        throw new Error(`Die Datei enthält kein gültiges JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
      this.importProgress.value = 40;

      // Schema validieren
      const validate = this.ajv.compile<NakDataset>(nakSchema);
      const isValid = validate(nakData);
      
      if (!isValid && validate.errors) {
        // Fehler sammeln (max. 10, nur erste pro Pfad)
        const uniqueErrors = new Map<string, string>();
        
        for (const error of validate.errors) {
          const path = error.instancePath || '/';
          if (!uniqueErrors.has(path)) {
            uniqueErrors.set(path, error.message || 'Unbekannter Fehler');
          }
          
          if (uniqueErrors.size >= 10) break;
        }
        
        this.importErrors.value = Array.from(uniqueErrors.entries()).map(([path, message]) => ({ 
          path, 
          message 
        }));
        
        if (this.importErrors.value.length > 0) {
          throw new Error(`Die Datei entspricht nicht dem NAK-Schema (${this.importErrors.value.length} Fehler)`);
        }
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
    } catch (error) {
      throw error;
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
      return allSongs;
    }
    
    // Suchanfrage normalisieren
    const normalizedQuery = query.trim().toLowerCase();
    
    // Filtern nach Suchanfrage und Filtern
    return allSongs.filter(song => {
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
