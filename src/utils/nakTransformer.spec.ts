import { describe, it, expect } from 'vitest';
import { transformNAKSongs, transformNAKSong } from './nakTransformer';

describe('transformNAKSongs', () => {
  it('parses a plain array of songs', () => {
    const songs = transformNAKSongs([{ number: '1', title: 'A', verses: { 1: ['a'] } }]);
    expect(songs).toHaveLength(1);
    expect(songs[0].title).toBe('A');
  });

  it('parses an object with a songs array', () => {
    const songs = transformNAKSongs({ songs: [{ number: '2', title: 'B', verses: { 1: ['b'] } }] });
    expect(songs).toHaveLength(1);
    expect(songs[0].number).toBe('2');
  });

  it('returns empty array for garbage input', () => {
    expect(transformNAKSongs(42)).toEqual([]);
    expect(transformNAKSongs(null)).toEqual([]);
    expect(transformNAKSongs('not-json')).toEqual([]);
  });

  it('parses a JSON string', () => {
    const songs = transformNAKSongs(JSON.stringify([{ number: '3', title: 'C', verses: { 1: ['c'] } }]));
    expect(songs).toHaveLength(1);
    expect(songs[0].title).toBe('C');
  });
});

describe('transformNAKSong', () => {
  it('builds a stable id from the number', () => {
    const song = transformNAKSong({ number: '123', title: 'Lied', verses: { 1: ['x'] } });
    expect(song.id).toBe('nak-123');
  });

  it('maps verses object into Verse entries', () => {
    const song = transformNAKSong({ number: '4', title: 'D', verses: { 1: ['a', 'b'], 2: ['c'] } });
    expect(song.verses).toEqual([
      { id: '1', lines: ['a', 'b'] },
      { id: '2', lines: ['c'] }
    ]);
  });

  it('reads verse order and refrain', () => {
    const song = transformNAKSong({
      number: '5',
      title: 'E',
      verses: { 1: ['a'] },
      refrain: ['R1'],
      verseOrder: ['1', 'R']
    });
    expect(song.refrain).toEqual({ id: 'R', lines: ['R1'] });
    expect(song.verseOrder).toEqual(['1', 'R']);
  });

  it('falls back to a placeholder verse for empty content', () => {
    const song = transformNAKSong({ number: '6', title: 'F' });
    expect(song.verses).toEqual([{ id: '1', lines: ['[Keine Verse gefunden]'] }]);
  });
});