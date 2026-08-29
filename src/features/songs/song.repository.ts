import type { Song } from './song.types';
import { readFileAsText } from '@/utils/file';
import * as idb from '@/utils/idb';
// JSON Schema Validator
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import songSchema from './song.schema.json';
import { transformNAKSongs } from '@/utils/nakTransformer';
import { searchSongs } from './search';

// Initialisiere JSON Schema Validator mit angepassten Optionen
const ajv = new Ajv({
  strict: false,
  allErrors: true,
  validateSchema: false // Deaktiviere die Validierung des Schemas selbst
});
addFormats(ajv);
const validateSong = ajv.compile(songSchema);

/** Ergebnis eines Lade-/Import-Vorgangs: gültige Lieder plus Fehler pro Datei */
export interface SongLoadResult {
  valid: Song[];
  invalid: { file: string; errors: string[] }[];
}

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
  async loadSongsFromDataPath(): Promise<SongLoadResult> {
    const sources: Array<{ file: string; transform?: (data: unknown) => Song[] }> = [
      { file: 'nakbuch_v5.4.0.json', transform: transformNAKSongs },
      { file: 'songs.json' }
    ];
    for (const { file, transform } of sources) {
      try {
        const response = await fetch(`${this.songsDataPath}/${file}`);
        if (!response.ok) continue;
        const data = await response.json();
        const songs = transform ? transform(data) : data;
        const result = this.validateSongs(songs, file);
        if (result.valid.length > 0) return result;
      } catch (error) {
        console.warn(`Konnte ${file} nicht laden:`, error);
      }
    }
    return { valid: [], invalid: [{ file: 'songs.json', errors: ['Keine Lieder aus dem Datenpfad geladen'] }] };
  }

  /**
   * Validiert ein Array von Liedern gegen das Schema
   */
  private validateSongs(songs: unknown[], filename: string): SongLoadResult {
    const result: SongLoadResult = { valid: [], invalid: [] };

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
      // Grundlegende Validierung ohne Schema
      if (!this.isBasicSongValid(song)) {
        result.invalid.push({
          file: filename,
          errors: ['Lied fehlt erforderliche Felder (id, title, verses)']
        });
        continue;
      }

      // Schema-Validierung
      if (validateSong(song)) {
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
  async importSongs(files: File[]): Promise<SongLoadResult> {
    const result: SongLoadResult = {
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
    return searchSongs(await this.getAllSongs(), query);
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
