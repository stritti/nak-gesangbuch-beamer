import { describe, it, expect } from 'vitest';
import { getBookName } from './book-names';

describe('getBookName', () => {
  it('maps known book ids', () => {
    expect(getBookName('gb')).toBe('Gesangbuch');
    expect(getBookName('cb')).toBe('Chorbuch');
    expect(getBookName('jl')).toBe('Jugendliederbuch');
    expect(getBookName('kl')).toBe('Kinderliederbuch');
  });

  it('falls back to uppercase id for unknown ids', () => {
    expect(getBookName('xyz')).toBe('XYZ');
  });
});