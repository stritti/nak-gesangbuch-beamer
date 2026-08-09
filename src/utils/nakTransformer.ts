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

function isNAKSongInternal(obj: unknown): obj is NAKSongInternal {
  return typeof obj === 'object' && obj !== null && 'title' in obj && 'verses' in obj;
}

export function transformNAKSongs(nakData: unknown): Song[] {
  if (typeof nakData === 'string') {
    try { nakData = JSON.parse(nakData); } catch { return []; }
  }
  if (Array.isArray(nakData)) return nakData.filter((i): i is Record<string, unknown> => !!i && typeof i === 'object').map(transformNAKSong);
  if (nakData && typeof nakData === 'object') {
    const nakObj = nakData as Record<string, unknown>;
    if ('songs' in nakObj && Array.isArray(nakObj.songs)) {
      return (nakObj.songs as unknown[]).filter((i): i is Record<string, unknown> => !!i && typeof i === 'object').map(transformNAKSong);
    }

    const metadataKeys = ['buecher', 'books', 'metadata', 'info', 'version'];
    const songs: Song[] = [];
    for (const key in nakObj) {
      if (metadataKeys.includes(key)) continue;
      if (Object.prototype.hasOwnProperty.call(nakObj, key) && typeof nakObj[key] === 'object' && nakObj[key] !== null) {
        const item = nakObj[key];
        if (item && typeof item === 'object' && ('title' in item || 'number' in item || 'verses' in item)) songs.push(transformNAKSong(item as Record<string, unknown>));
      }
    }
    if (songs.length > 0) return songs;
    if (isNAKSongInternal(nakData) || ((nakObj.title || nakObj.number) && (nakObj.verses || nakObj.text))) return [transformNAKSong(nakObj)];
  }
  return [];
}

export function transformNAKSong(nakSong: Record<string, unknown>): Song {
  const title = nakSong.title || nakSong.name || `Lied ${nakSong.number || 'ohne Nummer'}`;
  const id = nakSong.id ? String(nakSong.id) : (nakSong.number ? `nak-${nakSong.number}` : `nak-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  let verses: Verse[] = [];
  if (nakSong.verses) {
    if (typeof nakSong.verses === 'object' && !Array.isArray(nakSong.verses)) {
      verses = Object.entries(nakSong.verses).map(([id, lines]) => ({ id, lines: Array.isArray(lines) ? lines : [String(lines)] }));
    } else if (Array.isArray(nakSong.verses)) {
      verses = nakSong.verses.map((verse: unknown) => {
        if (typeof verse === 'object' && verse !== null && 'id' in verse && 'lines' in verse) {
          const v = verse as Record<string, unknown>;
          return { id: String(v.id), lines: Array.isArray(v.lines) ? (v.lines as string[]) : [String(v.lines)] };
        }
        return null;
      }).filter((v): v is Verse => v !== null);
    }
  } else if (nakSong.text) {
    if (typeof nakSong.text === 'string') verses = [{ id: '1', lines: nakSong.text.split('\n').filter(line => line.trim().length > 0) }];
    else if (Array.isArray(nakSong.text)) verses = [{ id: '1', lines: nakSong.text.map(line => String(line)) }];
  } else if (nakSong.strophen || nakSong.strophes) {
    const strophen = nakSong.strophen || nakSong.strophes;
    if (typeof strophen === 'object' && !Array.isArray(strophen)) {
      verses = Object.entries(strophen as Record<string, unknown>).map(([id, lines]) => ({ id, lines: Array.isArray(lines) ? lines : [String(lines)] }));
    } else if (Array.isArray(strophen)) {
      verses = strophen.map((strophe: unknown, index: number) => {
        if (typeof strophe === 'object' && strophe !== null && 'id' in strophe && 'lines' in strophe) {
          const s = strophe as Record<string, unknown>;
          return { id: String(s.id), lines: Array.isArray(s.lines) ? (s.lines as string[]) : [String(s.lines)] };
        } else if (Array.isArray(strophe)) return { id: String(index + 1), lines: strophe.map(line => String(line)) };
        else if (typeof strophe === 'string') return { id: String(index + 1), lines: [strophe] };
        return null;
      }).filter((v): v is Verse => v !== null);
    }
  }
  if (verses.length === 0) verses = [{ id: '1', lines: ['[Keine Verse gefunden]'] }];

  let refrain: Verse | undefined;
  if (nakSong.refrain) refrain = { id: 'R', lines: Array.isArray(nakSong.refrain) ? (nakSong.refrain as string[]) : [String(nakSong.refrain)] };
  else if (nakSong.chorus) refrain = { id: 'R', lines: Array.isArray(nakSong.chorus) ? (nakSong.chorus as string[]) : [String(nakSong.chorus)] };

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
