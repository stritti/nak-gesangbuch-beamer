import { describe, it, expect } from 'vitest';
import { splitVerseIntoSlides, createSlidesFromVerses } from './slideUtils';

describe('splitVerseIntoSlides', () => {
  it('returns empty array for empty input', () => {
    expect(splitVerseIntoSlides([], 4)).toEqual([]);
  });

  it('returns the verse as single slide when lines fit', () => {
    const lines = ['a', 'b'];
    expect(splitVerseIntoSlides(lines, 4)).toEqual([lines]);
  });

  it('splits long verses into chunks of maxLinesPerSlide', () => {
    const lines = ['1', '2', '3', '4', '5', '6'];
    expect(splitVerseIntoSlides(lines, 4)).toEqual([
      ['1', '2', '3', '4'],
      ['5', '6']
    ]);
  });
});

describe('createSlidesFromVerses', () => {
  it('returns empty array for no verses', () => {
    expect(createSlidesFromVerses([], 4)).toEqual([]);
  });

  it('flattens verse slides in order', () => {
    const verses = [
      { id: '1', lines: ['a', 'b'] },
      { id: '2', lines: ['c', 'd'] }
    ];
    expect(createSlidesFromVerses(verses, 4)).toEqual([
      ['a', 'b'],
      ['c', 'd']
    ]);
  });
});