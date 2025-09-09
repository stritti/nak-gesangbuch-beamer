/**
 * Transformer für NAK Gesangbuch Daten
 * Konvertiert das NAK-Gesangbuch-Format in unser internes Format
 */
import { Song, Verse } from '@/features/songs/song.types';

// Interface für die interne Struktur eines NAK-Songs während der Transformation
// Wird in den Transformationsfunktionen verwendet
type NAKSongInternal = {
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
};

// Typguard-Funktion, um zu prüfen, ob ein Objekt dem NAKSongInternal-Typ entspricht
function isNAKSongInternal(obj: unknown): obj is NAKSongInternal {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'title' in obj &&
    typeof obj.title === 'string' &&
    'verses' in obj &&
    typeof obj.verses === 'object'
  );
}

/**
 * Transformiert NAK-Gesangbuch-Daten in unser internes Format
 */
export function transformNAKSongs(nakData: unknown): Song[] {
  console.log('Transformiere NAK-Daten, Format:', typeof nakData, Array.isArray(nakData) ? 'Array' : 'Nicht-Array');
  
  // Spezialfall: Wenn nakData ein String ist, versuche es als JSON zu parsen
  if (typeof nakData === 'string') {
    try {
      nakData = JSON.parse(nakData);
      console.log('NAK-Daten erfolgreich aus String geparst');
    } catch (error) {
      console.error('Fehler beim Parsen der NAK-Daten aus String:', error);
      return [];
    }
  }
  
  // Prüfe, ob nakData ein Array ist
  if (Array.isArray(nakData)) {
    console.log(`NAK-Daten sind ein Array mit ${nakData.length} Elementen`);
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
  if (nakData && typeof nakData === 'object') {
    console.log('NAK-Daten sind ein Objekt mit Eigenschaften:', Object.keys(nakData).join(', '));
    
    // Prüfe auf verschiedene mögliche Strukturen
    if ('songs' in nakData && Array.isArray(nakData.songs)) {
      console.log(`NAK-Daten enthalten ein songs-Array mit ${nakData.songs.length} Elementen`);
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
          // Prüfe, ob es sich um ein Lied handelt (hat title oder number)
          const item = nakData[key];
          if (item.title || item.number || item.verses) {
            const song = transformNAKSong(item);
            songs.push(song);
          } else {
            console.log(`Überspringe Nicht-Lied-Objekt: ${key}`);
          }
        } catch (error) {
          console.warn(`Konnte Lied ${key} nicht transformieren:`, error);
        }
      }
    }
    
    if (songs.length > 0) {
      return songs;
    }
    
    // Spezialfall: Prüfe, ob nakData selbst ein einzelnes Lied ist
    try {
      if ((nakData.title || nakData.number) && (nakData.verses || nakData.text)) {
        console.log('NAK-Daten scheinen ein einzelnes Lied zu sein');
        const song = transformNAKSong(nakData);
        return [song];
      }
    } catch (error) {
      console.warn('Konnte NAK-Daten nicht als einzelnes Lied transformieren:', error);
    }
  }
  
  // Fallback: Leeres Array zurückgeben
  console.warn('Unbekanntes NAK-Datenformat, keine Lieder gefunden');
  return [];
}

/**
 * Transformiert ein einzelnes NAK-Lied in unser internes Format
 */
export function transformNAKSong(nakSong: Record<string, unknown>): Song {
  console.log('Transformiere Lied:', nakSong.number || nakSong.id || 'unbekannt');
  
  // Prüfe, ob das Lied die erforderlichen Eigenschaften hat
  if (!nakSong || typeof nakSong !== 'object') {
    throw new Error('Ungültiges NAK-Lied-Format');
  }
  
  // Spezialfall für 'buecher' Objekt, das kein Lied ist
  if (Object.prototype.hasOwnProperty.call(nakSong, 'buecher') || 
      Object.prototype.hasOwnProperty.call(nakSong, 'books')) {
    throw new Error('Metadaten-Objekt, kein Lied');
  }
  
  // Generiere einen Titel, falls keiner vorhanden ist
  const title = nakSong.title || nakSong.name || `Lied ${nakSong.number || 'ohne Nummer'}`;
  
  // Generiere eine ID, falls keine vorhanden
  const id = nakSong.id || (nakSong.number ? `nak-${nakSong.number}` : `nak-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  
  // Extrahiere Verse aus verschiedenen möglichen Formaten
  let verses: Verse[] = [];
  
  // Versuche verschiedene Formate für Verse zu erkennen
  if (nakSong.verses) {
    console.log('Verse-Format:', typeof nakSong.verses, Array.isArray(nakSong.verses) ? 'Array' : 'Nicht-Array');
    
    // Format: {verses: {"1": ["Zeile 1", "Zeile 2"], "2": ["Zeile 3", "Zeile 4"]}}
    if (typeof nakSong.verses === 'object' && !Array.isArray(nakSong.verses)) {
      verses = Object.entries(nakSong.verses).map(([id, lines]) => ({
        id,
        lines: Array.isArray(lines) ? lines : [String(lines)]
      }));
    } 
    // Format: {verses: [{id: "1", lines: ["Zeile 1", "Zeile 2"]}, {id: "2", lines: ["Zeile 3", "Zeile 4"]}]}
    else if (Array.isArray(nakSong.verses)) {
      verses = nakSong.verses.map((verse: Record<string, unknown>) => {
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
  // Alternative Formate prüfen
  else if (nakSong.text) {
    console.log('Verwende text-Eigenschaft als Verse');
    // Format: {text: "Zeile 1\nZeile 2\nZeile 3"}
    if (typeof nakSong.text === 'string') {
      verses = [{
        id: "1",
        lines: nakSong.text.split('\n').filter(line => line.trim().length > 0)
      }];
    } 
    // Format: {text: ["Zeile 1", "Zeile 2", "Zeile 3"]}
    else if (Array.isArray(nakSong.text)) {
      verses = [{
        id: "1",
        lines: nakSong.text.map(line => String(line))
      }];
    }
  } 
  // Prüfe auf Strophen-Format
  else if (nakSong.strophen || nakSong.strophes) {
    const strophen = nakSong.strophen || nakSong.strophes;
    console.log('Verwende strophen/strophes-Eigenschaft als Verse');
    
    if (typeof strophen === 'object' && !Array.isArray(strophen)) {
      verses = Object.entries(strophen).map(([id, lines]) => ({
        id,
        lines: Array.isArray(lines) ? lines : [String(lines)]
      }));
    } else if (Array.isArray(strophen)) {
      verses = strophen.map((strophe: unknown, index: number) => {
        if (typeof strophe === 'object' && strophe.id && strophe.lines) {
          return {
            id: String(strophe.id),
            lines: Array.isArray(strophe.lines) ? strophe.lines : [String(strophe.lines)]
          };
        } else if (Array.isArray(strophe)) {
          return {
            id: String(index + 1),
            lines: strophe.map(line => String(line))
          };
        } else if (typeof strophe === 'string') {
          return {
            id: String(index + 1),
            lines: [strophe]
          };
        }
        return null;
      }).filter(Boolean);
    }
  }
  
  // Wenn keine Verse gefunden wurden, erstelle einen Dummy-Vers
  if (verses.length === 0) {
    console.warn('Keine Verse gefunden, erstelle Dummy-Vers');
    verses = [{
      id: "1",
      lines: ["[Keine Verse gefunden]"]
    }];
  }
  
  // Refrain, falls vorhanden
  let refrain: Verse | undefined = undefined;
  if (nakSong.refrain) {
    console.log('Refrain gefunden');
    refrain = {
      id: 'R',
      lines: Array.isArray(nakSong.refrain) ? nakSong.refrain : [String(nakSong.refrain)]
    };
  } else if (nakSong.chorus) {
    console.log('Chorus als Refrain verwenden');
    refrain = {
      id: 'R',
      lines: Array.isArray(nakSong.chorus) ? nakSong.chorus : [String(nakSong.chorus)]
    };
  }
  
  // Verse-Reihenfolge erstellen
  let verseOrder: string[] = [];
  
  // Wenn verseOrder im Original vorhanden ist
  if (nakSong.verseOrder && Array.isArray(nakSong.verseOrder)) {
    console.log('Verwende vorhandene verseOrder');
    verseOrder = nakSong.verseOrder;
  } else if (nakSong.order && Array.isArray(nakSong.order)) {
    console.log('Verwende order als verseOrder');
    verseOrder = nakSong.order;
  } 
  // Sonst erstelle eine Reihenfolge (1, 2, 3, ... mit Refrain nach jedem Vers, falls vorhanden)
  else {
    console.log('Erstelle verseOrder aus Versen');
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
