import { Song } from './song.types';
import { readFileAsText } from '@/utils/file';
import * as idb from '@/utils/idb';
// JSON Schema Validator
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import songSchema from './song.schema.json';
import { transformNAKSongs } from '@/utils/nakTransformer';

// Initialisiere JSON Schema Validator mit angepassten Optionen
const ajv = new Ajv({
  strict: false,
  allErrors: true,
  validateSchema: false // Deaktiviere die Validierung des Schemas selbst
});
addFormats(ajv);
const validateSong = ajv.compile(songSchema);

/**
 * Song Repository - Verantwortlich für Import, Validierung, Persistenz und Suche von Liedern
 */
export class SongRepository {
  private songsDataPath: string;

  constructor() {
    // Verwende die konfigurierte Umgebungsvariable oder den Standardpfad
    this.songsDataPath = process.env.SONGS_DATA_PATH || '/data';
  }

  /**
   * Lädt Lieder aus dem konfigurierten Datenpfad
   */
  async loadSongsFromDataPath(): Promise<{ valid: Song[]; invalid: { file: string; errors: string[] }[] }> {
    try {
      // Versuche zuerst, die NAK-Gesangbuch-Datei zu laden
      try {
        console.log(`Versuche NAK-Gesangbuch zu laden von: ${this.songsDataPath}/nakbuch_v5.4.0.json`);
        const nakResponse = await fetch(`${this.songsDataPath}/nakbuch_v5.4.0.json`);
        if (nakResponse.ok) {
          console.log('NAK-Gesangbuch-Datei erfolgreich geladen');
          const nakData = await nakResponse.json();
          console.log('NAK-Gesangbuch-Daten erfolgreich geparst');
          
          try {
            // Transformiere die NAK-Daten in unser Format
            const transformedSongs = transformNAKSongs(nakData);
            
            if (transformedSongs.length > 0) {
              console.log(`${transformedSongs.length} Lieder aus NAK-Gesangbuch geladen`);
              // Validiere die transformierten Lieder
              return this.validateSongs(transformedSongs, 'nakbuch_v5.4.0.json');
            } else {
              console.warn('Keine Lieder im NAK-Gesangbuch gefunden');
            }
          } catch (transformError) {
            console.error('Fehler beim Transformieren der NAK-Daten:', transformError);
          }
        } else {
          console.warn(`NAK-Gesangbuch konnte nicht geladen werden: ${nakResponse.status} ${nakResponse.statusText}`);
        }
      } catch (nakError) {
        console.warn('NAK-Gesangbuch konnte nicht geladen werden, versuche Standard-Datei:', nakError);
      }
      
      // Fallback: Versuche die Standard-Datei zu laden
      const response = await fetch(`${this.songsDataPath}/songs.json`);
      if (!response.ok) {
        throw new Error(`Fehler beim Laden der Lieder: ${response.statusText}`);
      }
      
      const songsData = await response.json();
      
      // Validiere die geladenen Lieder
      return this.validateSongs(songsData, 'songs.json');
    } catch (error) {
      console.error('Fehler beim Laden der Lieder aus dem Datenpfad:', error);
      return { valid: [], invalid: [{ file: 'songs.json', errors: [(error as Error).message] }] };
    }
  }

  /**
   * Validiert ein Array von Liedern gegen das Schema
   */
  private validateSongs(songs: unknown[], filename: string): { valid: Song[]; invalid: { file: string; errors: string[] }[] } {
    const result: { valid: Song[]; invalid: { file: string; errors: string[] }[] } = {
      valid: [],
      invalid: []
    };

    // Wenn songs kein Array ist, behandle es als Fehler
    if (!Array.isArray(songs)) {
      result.invalid.push({
        file: filename,
        errors: ['Die Datei enthält kein gültiges Array von Liedern']
      });
      return result;
    }

    // Validiere jedes Lied
    for (const song of songs) {
      try {
        // Grundlegende Validierung ohne Schema
        if (!this.isBasicSongValid(song)) {
          result.invalid.push({
            file: filename,
            errors: ['Lied fehlt erforderliche Felder (id, title, verses)']
          });
          continue;
        }

        // Versuche Schema-Validierung
        const isValid = validateSong(song);
        if (isValid) {
          result.valid.push(song as unknown as Song);
        } else {
          const errors = validateSong.errors?.map(err => 
            `${err.instancePath} ${err.message}`
          ) || ['Unbekannter Validierungsfehler'];
          
          result.invalid.push({
            file: filename,
            errors: errors.slice(0, 5) // Maximal 5 Fehler anzeigen
          });
        }
      } catch (error) {
        // Fallback bei Validierungsfehlern
        console.error('Fehler bei der Validierung:', error);
        if (this.isBasicSongValid(song)) {
          // Wenn grundlegende Validierung erfolgreich, akzeptiere das Lied trotzdem
          result.valid.push(song as unknown as Song);
        } else {
          result.invalid.push({
            file: filename,
            errors: [(error as Error).message]
          });
        }
      }
    }

    return result;
  }

  /**
   * Prüft, ob ein Lied die grundlegenden Anforderungen erfüllt
   */
  private isBasicSongValid(song: unknown): boolean {
    return Boolean(
      song && 
      typeof song === 'object' &&
      'id' in song &&
      typeof song.id === 'string' && 
      song.id.length > 0 &&
      'title' in song &&
      typeof song.title === 'string' && 
      song.title.length > 0 &&
      'verses' in song &&
      Array.isArray(song.verses) && 
      song.verses.length > 0 &&
      song.verses.every((verse: Record<string, unknown>) => 
        typeof verse === 'object' &&
        'id' in verse &&
        typeof verse.id === 'string' &&
        'lines' in verse &&
        Array.isArray(verse.lines) &&
        verse.lines.length > 0 &&
        verse.lines.every((line: unknown) => typeof line === 'string')
      )
    );
  }
  /**
   * Importiert Lieder aus JSON-Dateien
   */
  async importSongs(files: File[]): Promise<{ valid: Song[]; invalid: { file: string; errors: string[] }[] }> {
    const result: { valid: Song[]; invalid: { file: string; errors: string[] }[] } = {
      valid: [],
      invalid: []
    };

    for (const file of files) {
      try {
        // Datei einlesen
        const content = await readFileAsText(file);
        
        // JSON parsen
        let songs: unknown;
        try {
          songs = JSON.parse(content);
        } catch (error) {
          result.invalid.push({
            file: file.name,
            errors: ['Ungültiges JSON-Format']
          });
          continue;
        }
        
        // Stelle sicher, dass wir ein Array haben (einzelnes Lied in Array umwandeln)
        const songsArray = Array.isArray(songs) ? songs : [songs];
        
        // Validiere die Lieder
        const validationResult = this.validateSongs(songsArray, file.name);
        
        // Füge gültige Lieder zum Ergebnis hinzu
        result.valid.push(...validationResult.valid);
        
        // Füge ungültige Lieder zum Ergebnis hinzu
        result.invalid.push(...validationResult.invalid);
        
        // Speichere gültige Lieder in der IndexedDB
        await this.saveSongs(validationResult.valid);
      } catch (error) {
        result.invalid.push({
          file: file.name,
          errors: [(error as Error).message]
        });
      }
    }

    return result;
  }

  /**
   * Sucht nach Liedern basierend auf Suchbegriff
   */
  async searchSongs(query: string): Promise<Song[]> {
    if (!query.trim()) {
      return this.getAllSongs();
    }
    
    try {
      // Alle Lieder laden
      const allSongs = await this.getAllSongs();
      
      // Suchbegriff normalisieren
      const normalizedQuery = query.toLowerCase().trim();
      
      // Fuzzy-Suche implementieren
      return allSongs.filter(song => {
        // Suche in Titel
        if (song.title.toLowerCase().includes(normalizedQuery)) {
          return true;
        }
        
        // Suche in Nummer
        if (song.number && song.number.includes(normalizedQuery)) {
          return true;
        }
        
        // Suche in Themen
        if (song.topics && song.topics.some(topic => 
          topic.toLowerCase().includes(normalizedQuery)
        )) {
          return true;
        }
        
        // Suche in Versen (Volltext)
        if (song.verses.some(verse => 
          verse.lines.some(line => 
            line.toLowerCase().includes(normalizedQuery)
          )
        )) {
          return true;
        }
        
        // Suche im Refrain
        if (song.refrain && song.refrain.lines.some(line => 
          line.toLowerCase().includes(normalizedQuery)
        )) {
          return true;
        }
        
        return false;
      });
    } catch (error) {
      console.error('Fehler bei der Suche:', error);
      return [];
    }
  }

  /**
   * Speichert ein Lied in der IndexedDB
   */
  async saveSong(song: Song): Promise<void> {
    await idb.set('songs', song);
  }

  /**
   * Speichert mehrere Lieder in der IndexedDB
   */
  async saveSongs(songs: Song[]): Promise<void> {
    await idb.setMany('songs', songs);
  }

  /**
   * Lädt alle Lieder aus der IndexedDB
   */
  async getAllSongs(): Promise<Song[]> {
    try {
      // Zuerst versuchen, aus der IndexedDB zu laden
      const songs = await idb.getAll<Song>('songs');
      
      // Wenn keine Lieder in der IndexedDB sind, versuche aus dem Datenpfad zu laden
      if (songs.length === 0) {
        const loadResult = await this.loadSongsFromDataPath();
        if (loadResult.valid.length > 0) {
          // Speichere die geladenen Lieder in der IndexedDB
          await this.saveSongs(loadResult.valid);
          return loadResult.valid;
        }
      }
      
      return songs;
    } catch (error) {
      console.error('Fehler beim Laden der Lieder:', error);
      return [];
    }
  }

  /**
   * Lädt ein Lied anhand seiner ID
   */
  async getSongById(id: string): Promise<Song | null> {
    try {
      const song = await idb.get<Song>('songs', id);
      return song || null;
    } catch (error) {
      console.error(`Fehler beim Laden des Liedes mit ID ${id}:`, error);
      return null;
    }
  }
}

// Singleton-Instanz exportieren
export const songRepository = new SongRepository();
