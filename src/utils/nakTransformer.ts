/**
 * Transformer für NAK Gesangbuch Daten
 * Konvertiert das NAK-Gesangbuch-Format in unser internes Format
 */
import { Song, Verse } from '@/features/songs/song.types';

interface NAKSong {
  id: string;
  number: string;
  title: string;
  verses: {
    [key: string]: string[];
  };
  refrain?: string[];
  authors?: string[];
  copyright?: string;
  language?: string;
  topics?: string[];
}

/**
 * Transformiert NAK-Gesangbuch-Daten in unser internes Format
 */
export function transformNAKSongs(nakData: any): Song[] {
  // Prüfe, ob nakData ein Array ist
  if (Array.isArray(nakData)) {
    const songs: Song[] = [];
    for (const item of nakData) {
      try {
        if (item && typeof item === 'object') {
          const song = transformNAKSong(item);
          songs.push(song);
        }
      } catch (error) {
        console.warn(`Konnte Lied nicht transformieren:`, error);
      }
    }
    return songs;
  }
  
  // Wenn nakData ein Objekt mit einer songs-Eigenschaft ist
  if (nakData && typeof nakData === 'object' && 'songs' in nakData && Array.isArray(nakData.songs)) {
    const songs: Song[] = [];
    for (const item of nakData.songs) {
      try {
        if (item && typeof item === 'object') {
          const song = transformNAKSong(item);
          songs.push(song);
        }
      } catch (error) {
        console.warn(`Konnte Lied nicht transformieren:`, error);
      }
    }
    return songs;
  }
  
  // Wenn nakData ein Objekt mit Liedern als Eigenschaften ist (z.B. {song1: {...}, song2: {...}})
  if (nakData && typeof nakData === 'object') {
    // Ignoriere bekannte Metadaten-Eigenschaften
    const metadataKeys = ['buecher', 'books', 'metadata', 'info', 'version'];
    
    const songs: Song[] = [];
    for (const key in nakData) {
      if (metadataKeys.includes(key)) {
        console.log(`Überspringe Metadaten-Objekt: ${key}`);
        continue;
      }
      
      if (Object.prototype.hasOwnProperty.call(nakData, key) && typeof nakData[key] === 'object') {
        try {
          const song = transformNAKSong(nakData[key]);
          songs.push(song);
        } catch (error) {
          console.warn(`Konnte Lied ${key} nicht transformieren:`, error);
        }
      }
    }
    return songs;
  }
  
  // Fallback: Leeres Array zurückgeben
  console.warn('Unbekanntes NAK-Datenformat, keine Lieder gefunden');
  return [];
}

/**
 * Transformiert ein einzelnes NAK-Lied in unser internes Format
 */
export function transformNAKSong(nakSong: any): Song {
  // Prüfe, ob das Lied die erforderlichen Eigenschaften hat
  if (!nakSong || typeof nakSong !== 'object') {
    throw new Error('Ungültiges NAK-Lied-Format');
  }
  
  // Spezialfall für 'buecher' Objekt, das kein Lied ist
  if (nakSong.hasOwnProperty('buecher') || nakSong.hasOwnProperty('books')) {
    throw new Error('Metadaten-Objekt, kein Lied');
  }
  
  // Generiere einen Titel, falls keiner vorhanden ist
  const title = nakSong.title || nakSong.name || `Lied ${nakSong.number || 'ohne Nummer'}`;
  
  // Generiere eine ID, falls keine vorhanden
  const id = nakSong.id || (nakSong.number ? `nak-${nakSong.number}` : `nak-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  
  // Extrahiere Verse aus verschiedenen möglichen Formaten
  let verses: Verse[] = [];
  
  if (nakSong.verses) {
    // Format: {verses: {"1": ["Zeile 1", "Zeile 2"], "2": ["Zeile 3", "Zeile 4"]}}
    if (typeof nakSong.verses === 'object' && !Array.isArray(nakSong.verses)) {
      verses = Object.entries(nakSong.verses).map(([id, lines]) => ({
        id,
        lines: Array.isArray(lines) ? lines : [String(lines)]
      }));
    } 
    // Format: {verses: [{id: "1", lines: ["Zeile 1", "Zeile 2"]}, {id: "2", lines: ["Zeile 3", "Zeile 4"]}]}
    else if (Array.isArray(nakSong.verses)) {
      verses = nakSong.verses.map((verse: any) => {
        if (typeof verse === 'object' && verse.id && verse.lines) {
          return {
            id: String(verse.id),
            lines: Array.isArray(verse.lines) ? verse.lines : [String(verse.lines)]
          };
        }
        return null;
      }).filter(Boolean);
    }
  }
  
  // Wenn keine Verse gefunden wurden, erstelle einen Dummy-Vers
  if (verses.length === 0) {
    verses = [{
      id: "1",
      lines: ["[Keine Verse gefunden]"]
    }];
  }
  
  // Refrain, falls vorhanden
  let refrain: Verse | undefined = undefined;
  if (nakSong.refrain) {
    refrain = {
      id: 'R',
      lines: Array.isArray(nakSong.refrain) ? nakSong.refrain : [String(nakSong.refrain)]
    };
  }
  
  // Verse-Reihenfolge erstellen
  let verseOrder: string[] = [];
  
  // Wenn verseOrder im Original vorhanden ist
  if (nakSong.verseOrder && Array.isArray(nakSong.verseOrder)) {
    verseOrder = nakSong.verseOrder;
  } 
  // Sonst erstelle eine Reihenfolge (1, 2, 3, ... mit Refrain nach jedem Vers, falls vorhanden)
  else {
    verseOrder = verses.flatMap(verse => 
      refrain ? [verse.id, 'R'] : [verse.id]
    );
  }
  
  // Transformiertes Lied zurückgeben
  return {
    id,
    number: nakSong.number ? String(nakSong.number) : undefined,
    title: String(title),
    subtitle: nakSong.subtitle ? String(nakSong.subtitle) : undefined,
    language: nakSong.language || 'de',
    authors: Array.isArray(nakSong.authors) ? nakSong.authors : 
             (nakSong.authors ? [String(nakSong.authors)] : []),
    topics: Array.isArray(nakSong.topics) ? nakSong.topics : 
            (nakSong.topics ? [String(nakSong.topics)] : []),
    copyright: nakSong.copyright ? String(nakSong.copyright) : undefined,
    verses,
    refrain,
    verseOrder,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
