import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSetlistsFromStorage, saveSetlistsToStorage } from './setlist.storage';
import type { Setlist } from './setlist.types';

function createMockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
    _store: store
  };
}

describe('setlist.storage', () => {
  let storage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it('loads empty array when nothing stored', () => {
    expect(loadSetlistsFromStorage(storage)).toEqual([]);
  });

  it('round-trips setlists', () => {
    const setlist: Setlist = {
      id: 'a1',
      name: 'Sonntag',
      items: [{ songId: 'nak-1', verseIds: ['1', 'R'] }],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    };
    saveSetlistsToStorage([setlist], storage);
    expect(loadSetlistsFromStorage(storage)).toEqual([setlist]);
  });

  it('returns empty array for corrupt JSON', () => {
    storage._store.set('setlists', '{kaputt');
    expect(loadSetlistsFromStorage(storage)).toEqual([]);
  });
});