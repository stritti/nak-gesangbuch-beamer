import { describe, it, expect } from 'vitest';
import { buildSlides } from './slides';
import type { Song } from '@/features/songs/song.types';

const song = (overrides: Partial<Song>): Song => ({
  id: 'nak-1',
  title: 'Test',
  verses: [
    { id: '1', lines: ['Zeile 1', 'Zeile 2'] },
    { id: '2', lines: ['Zeile 3'] }
  ],
  ...overrides
});

describe('buildSlides', () => {
  it('returns empty array for null', () => {
    expect(buildSlides(null)).toEqual([]);
  });

  it('returns one slide per verse in order', () => {
    expect(buildSlides(song({}))).toEqual([
      ['Zeile 1', 'Zeile 2'],
      ['Zeile 3']
    ]);
  });

  it('respects verseOrder and inserts the refrain', () => {
    const s = song({
      refrain: { id: 'R', lines: ['Kehrvers'] },
      verseOrder: ['1', 'R', '2']
    });
    expect(buildSlides(s)).toEqual([
      ['Zeile 1', 'Zeile 2'],
      ['Kehrvers'],
      ['Zeile 3']
    ]);
  });

  it('skips unknown verse ids', () => {
    expect(buildSlides(song({ verseOrder: ['1', '99', '2'] }))).toEqual([
      ['Zeile 1', 'Zeile 2'],
      ['Zeile 3']
    ]);
  });
});