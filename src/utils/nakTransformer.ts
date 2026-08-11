/**
 * Transformer für NAK Gesangbuch Daten
 * Konvertiert das NAK-Gesangbuch-Format in unser internes Format
 */
import { Song, Verse } from '@/features/songs/song.types';

type NAKSongInternal = {
  id: string;
  number: string;
  title: string;
  verses: { [key: string]: string[] };
  refrain?: string[];
  authors?: string[];
  copyright?: string;
  language?: string;
  topics?: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toLines(value: unknown): string[] | null {
  if (Array.isArray(value)) return value.map((line) => String(line));
  if (typeof value === 'string') return [value];
  return null;
}

function isNAKSongInternal(obj: unknown): obj is NAKSongInternal {
  return isRecord(obj) && 'title' in obj && 'verses' in obj;
}

export function transformNAKSongs(nakData: unknown): Song[] {
  if (typeof nakData === 'string') {
    try { nakData = JSON.parse(nakData); } catch { return []; }
  }
  if (Array.isArray(nakData)) return nakData.filter(isRecord).map(transformNAKSong);
  if (isRecord(nakData)) {
    if ('songs' in nakData && Array.isArray(nakData.songs)) {
      return (nakData.songs as unknown[]).filter(isRecord).map(transformNAKSong);
    }

    const metadataKeys = ['buecher', 'books', 'metadata', 'info', 'version'];
    const songs: Song[] = [];
    for (const key in nakData) {
      if (metadataKeys.includes(key)) continue;
      if (Object.prototype.hasOwnProperty.call(nakData, key) && isRecord(nakData[key])) {
        const item = nakData[key];
        if (isRecord(item) && ('title' in item || 'number' in item || 'verses' in item)) songs.push(transformNAKSong(item));
      }
    }
    if (songs.length > 0) return songs;
    if (isNAKSongInternal(nakData) || ((nakData.title || nakData.number) && (nakData.verses || nakData.text))) return [transformNAKSong(nakData)];
  }
  return [];
}

export function transformNAKSong(nakSong: Record<string, unknown>): Song {
  const title = nakSong.title || nakSong.name || `Lied ${nakSong.number || 'ohne Nummer'}`;
  const id = nakSong.id ? String(nakSong.id) : (nakSong.number ? `nak-${nakSong.number}` : `nak-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  let verses: Verse[] = [];
  if (nakSong.verses) {
    if (isRecord(nakSong.verses)) {
      verses = Object.entries(nakSong.verses).map(([id, lines]) => ({ id, lines: toLines(lines) ?? [] }));
    } else if (Array.isArray(nakSong.verses)) {
      verses = nakSong.verses.map((verse: unknown) => {
        if (isRecord(verse) && 'id' in verse && 'lines' in verse) {
          return { id: String(verse.id), lines: toLines(verse.lines) ?? [] };
        }
        return null;
      }).filter((v): v is Verse => v !== null);
    }
  } else if (nakSong.text) {
    if (typeof nakSong.text === 'string') verses = [{ id: '1', lines: nakSong.text.split('\n').filter(line => line.trim().length > 0) }];
    else if (Array.isArray(nakSong.text)) verses = [{ id: '1', lines: nakSong.text.map(line => String(line)) }];
  } else if (nakSong.strophen || nakSong.strophes) {
    const strophen = nakSong.strophen || nakSong.strophes;
    if (isRecord(strophen)) {
      verses = Object.entries(strophen).map(([id, lines]) => ({ id, lines: toLines(lines) ?? [] }));
    } else if (Array.isArray(strophen)) {
      verses = strophen.map((strophe: unknown, index: number) => {
        if (isRecord(strophe) && 'id' in strophe && 'lines' in strophe) {
          return { id: String(strophe.id), lines: toLines(strophe.lines) ?? [] };
        } else if (Array.isArray(strophe)) return { id: String(index + 1), lines: strophe.map(line => String(line)) };
        else if (typeof strophe === 'string') return { id: String(index + 1), lines: [strophe] };
        return null;
      }).filter((v): v is Verse => v !== null);
    }
  }
  if (verses.length === 0) verses = [{ id: '1', lines: ['[Keine Verse gefunden]'] }];

  let refrain: Verse | undefined;
  if (nakSong.refrain) refrain = { id: 'R', lines: toLines(nakSong.refrain) ?? [] };
  else if (nakSong.chorus) refrain = { id: 'R', lines: toLines(nakSong.chorus) ?? [] };

  let verseOrder: string[] = [];
  if (nakSong.verseOrder && Array.isArray(nakSong.verseOrder)) verseOrder = nakSong.verseOrder as string[];
  else if (nakSong.order && Array.isArray(nakSong.order)) verseOrder = nakSong.order as string[];
  else verseOrder = verses.flatMap(verse => refrain ? [verse.id, 'R'] : [verse.id]);

  return {
    id,
    number: nakSong.number ? String(nakSong.number) : undefined,
    title: String(title),
    subtitle: nakSong.subtitle ? String(nakSong.subtitle) : undefined,
    language: nakSong.language ? String(nakSong.language) : 'de',
    authors: Array.isArray(nakSong.authors) ? (nakSong.authors as string[]) : (nakSong.authors ? [String(nakSong.authors)] : []),
    topics: Array.isArray(nakSong.topics) ? (nakSong.topics as string[]) : (nakSong.topics ? [String(nakSong.topics)] : []),
    copyright: nakSong.copyright ? String(nakSong.copyright) : undefined,
    verses,
    refrain,
    verseOrder,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
