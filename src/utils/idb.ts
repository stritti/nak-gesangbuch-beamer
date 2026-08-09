import { openDB, DBSchema, IDBPDatabase, StoreNames, StoreValue } from 'idb';

interface AppDB extends DBSchema {
  songs: {
    key: string;
    value: Record<string, unknown>;
    indexes: { 'by-title': string };
  };
  books: {
    key: string;
    value: Record<string, unknown>;
  };
  setlists: {
    key: string;
    value: Record<string, unknown>;
  };
}

const DB_NAME = 'nak-gesangbuch-beamer';
const DB_VERSION = 1;

/**
 * Öffnet die IndexedDB-Datenbank
 */
async function getDb(): Promise<IDBPDatabase<AppDB>> {
  return openDB<AppDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Songs-Store
      if (!db.objectStoreNames.contains('songs')) {
        const songsStore = db.createObjectStore('songs', { keyPath: 'id' });
        songsStore.createIndex('by-title', 'title');
      }
      
      // Books-Store
      if (!db.objectStoreNames.contains('books')) {
        db.createObjectStore('books', { keyPath: 'id' });
      }
      
      // Setlists-Store
      if (!db.objectStoreNames.contains('setlists')) {
        db.createObjectStore('setlists', { keyPath: 'id' });
      }
    }
  });
}

/**
 * Speichert ein Objekt in einem Store
 */
export async function set<T>(storeName: StoreNames<AppDB>, item: T): Promise<void> {
  const db = await getDb();
  await db.put(storeName, item as StoreValue<AppDB, typeof storeName>);
}

/**
 * Speichert mehrere Objekte in einem Store
 */
export async function setMany<T>(storeName: StoreNames<AppDB>, items: T[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  for (const item of items) {
    await store.put(item as StoreValue<AppDB, typeof storeName>);
  }
  
  await tx.done;
}

/**
 * Lädt ein Objekt aus einem Store anhand seines Schlüssels
 */
export async function get<T>(storeName: StoreNames<AppDB>, key: string): Promise<T | undefined> {
  const db = await getDb();
  return db.get(storeName, key) as Promise<T | undefined>;
}

/**
 * Lädt alle Objekte aus einem Store
 */
export async function getAll<T>(storeName: StoreNames<AppDB>): Promise<T[]> {
  const db = await getDb();
  return db.getAll(storeName) as Promise<T[]>;
}

/**
 * Löscht ein Objekt aus einem Store anhand seines Schlüssels
 */
export async function remove(storeName: StoreNames<AppDB>, key: string): Promise<void> {
  const db = await getDb();
  await db.delete(storeName, key);
}

/**
 * Löscht alle Objekte aus einem Store
 */
export async function clear(storeName: StoreNames<AppDB>): Promise<void> {
  const db = await getDb();
  await db.clear(storeName);
}
