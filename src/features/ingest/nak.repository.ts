import type { NakDataset } from './nak.types';
import type { Song } from '@/features/songs/song.types';
import { transformNakDataset } from './nak.parser';
import * as idb from '@/utils/idb';
import { readFileAsText } from '@/utils/file';
import { getBookName } from '@/features/songs/book-names';
import { searchSongs } from '@/features/songs/search';

/**
 * Repository für den Import, die Validierung und Persistenz von NAK-Daten
 */
export class NakRepository {
  /**
   * Importiert und validiert eine NAK-JSON-Datei
   * @param file Die zu importierende JSON-Datei
   * @returns Die validierten und transformierten Songs
   */
  async importNakFile(file: File): Promise<{ 
    songs: Song[]; 
    books: Array<{ id: string; title: string; count: number }>;
    version: string; 
    errors: Array<{ path: string; message: string }> 
  }> {
    // Datei einlesen
    const content = await readFileAsText(file);

    // JSON parsen
    let nakData: NakDataset;
    try {
      nakData = JSON.parse(content) as NakDataset;
    } catch (error) {
      throw new Error(`Die Datei enthält kein gültiges JSON: ${error instanceof Error ? error.message : String(error)}`);
    }

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
      throw new Error(`Die Datei entspricht nicht dem NAK-Schema (${errors.length} Fehler)`);
    }

    // Bücher extrahieren und in IndexedDB speichern
    const books = nakData.buecher.map(book => ({
      id: book.id,
      title: book.title || getBookName(book.id),
      count: book.hymnCount || 0
    }));
    
    // Daten transformieren
    const songs = transformNakDataset(nakData as NakDataset);

    // In IndexedDB speichern
    await this.saveSongs(songs);
    
    // Bücher in IndexedDB speichern
    await this.saveBooks(books);

    return {
      songs,
      books,
      version: nakData.version,
      errors: []
    };
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
   * Speichert Bücher in der IndexedDB
   * @param books Die zu speichernden Bücher
   */
  private async saveBooks(books: Array<{ id: string; title: string; count: number }>): Promise<void> {
    // Zuerst alle vorhandenen Bücher löschen
    await idb.clear('books');
    
    // Dann neue Bücher speichern
    await idb.setMany('books', books);
    
    console.log(`${books.length} Bücher erfolgreich in IndexedDB gespeichert`);
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
    const allSongs = await idb.getAll<Song>('songs');
    return searchSongs(allSongs, query, filters);
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
          // Buchtitel aus der Buch-ID ermitteln
          bookMap.set(buchId, {
            id: buchId,
            title: getBookName(buchId),
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
