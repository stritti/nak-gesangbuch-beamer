import type { Setlist } from './setlist.types';

const STORAGE_KEY = 'setlists';

export function loadSetlistsFromStorage(storage: Pick<Storage, 'getItem'> = localStorage): Setlist[] {
  const stored = storage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as Setlist[]) : [];
  } catch (error) {
    console.error('Fehler beim Laden der Setlists:', error);
    return [];
  }
}

export function saveSetlistsToStorage(setlists: Setlist[], storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(setlists));
}