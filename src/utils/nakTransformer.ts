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
export function transformNAKSongs(nakSongs: NAKSong[]): Song[] {
  return nakSongs.map(transformNAKSong);
}

/**
 * Transformiert ein einzelnes NAK-Lied in unser internes Format
 */
export function transformNAKSong(nakSong: NAKSong): Song {
  // Verse aus dem NAK-Format extrahieren
  const verses: Verse[] = Object.entries(nakSong.verses).map(([id, lines]) => ({
    id,
    lines
  }));

  // Refrain, falls vorhanden
  const refrain: Verse | undefined = nakSong.refrain
    ? {
        id: 'R',
        lines: nakSong.refrain
      }
    : undefined;

  // Verse-Reihenfolge erstellen (1, 2, 3, ... mit Refrain nach jedem Vers, falls vorhanden)
  const verseOrder = verses.flatMap(verse => 
    refrain ? [verse.id, 'R'] : [verse.id]
  );

  // Transformiertes Lied zurückgeben
  return {
    id: nakSong.id || `nak-${nakSong.number}`,
    number: nakSong.number,
    title: nakSong.title,
    language: nakSong.language || 'de',
    authors: nakSong.authors || [],
    topics: nakSong.topics || [],
    copyright: nakSong.copyright,
    verses,
    refrain,
    verseOrder,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
