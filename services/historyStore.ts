import { HistoryItem } from '../types';

const DB_NAME = 'oddoneout-detector';
const DB_VERSION = 1;
const STORE_NAME = 'history';
const TIMESTAMP_INDEX = 'timestamp';
const LEGACY_STORAGE_KEY = 'oddoneout-history';

let dbPromise: Promise<IDBDatabase> | null = null;
let indexedDBAvailable: boolean | null = null;

// Check if IndexedDB is actually usable (not just defined)
async function checkIndexedDBAvailable(): Promise<boolean> {
  if (indexedDBAvailable !== null) return indexedDBAvailable;

  if (typeof indexedDB === 'undefined') {
    indexedDBAvailable = false;
    return false;
  }

  try {
    // Try to actually open a test database
    const testDb = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('__test__', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    testDb.close();
    indexedDB.deleteDatabase('__test__');
    indexedDBAvailable = true;
    return true;
  } catch {
    console.warn('[HistoryStore] IndexedDB is not available, history persistence will be disabled.');
    indexedDBAvailable = false;
    return false;
  }
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex(TIMESTAMP_INDEX, 'timestamp', { unique: false });
      } else {
        const store = request.transaction?.objectStore(STORE_NAME);
        if (store && !store.indexNames.contains(TIMESTAMP_INDEX)) {
          store.createIndex(TIMESTAMP_INDEX, 'timestamp', { unique: false });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
  });

  return dbPromise;
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted.'));
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed.'));
  });
}

export async function loadHistoryItems(): Promise<HistoryItem[]> {
  if (!(await checkIndexedDBAvailable())) return [];

  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index(TIMESTAMP_INDEX);

      const items: HistoryItem[] = [];
      const request = index.openCursor(null, 'prev');

      request.onerror = () => reject(request.error ?? new Error('Failed to read history cursor.'));
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        items.push(cursor.value as HistoryItem);
        cursor.continue();
      };

      tx.oncomplete = () => resolve(items);
      tx.onerror = () => reject(tx.error ?? new Error('Failed to load history.'));
      tx.onabort = () => reject(tx.error ?? new Error('Failed to load history.'));
    });
  } catch (error) {
    console.warn('[HistoryStore] Failed to load history:', error);
    return [];
  }
}

export async function saveHistoryItem(item: HistoryItem): Promise<void> {
  if (!(await checkIndexedDBAvailable())) return;

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(item);
    await transactionDone(tx);
  } catch (error) {
    console.warn('[HistoryStore] Failed to save history item:', error);
  }
}

export async function deleteHistoryItem(id: string): Promise<void> {
  if (!(await checkIndexedDBAvailable())) return;

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    await transactionDone(tx);
  } catch (error) {
    console.warn('[HistoryStore] Failed to delete history item:', error);
  }
}

export async function clearHistoryItems(): Promise<void> {
  if (!(await checkIndexedDBAvailable())) return;

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    await transactionDone(tx);
  } catch (error) {
    console.warn('[HistoryStore] Failed to clear history:', error);
  }
}

function readLegacyHistoryFromLocalStorage(): HistoryItem[] | null {
  try {
    const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return null;
    return parsed as HistoryItem[];
  } catch {
    return null;
  }
}

async function migrateLegacyHistoryFromLocalStorage(): Promise<boolean> {
  if (!(await checkIndexedDBAvailable())) return false;

  const legacy = readLegacyHistoryFromLocalStorage();
  if (!legacy || legacy.length === 0) return false;

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const item of legacy) {
      store.put(item);
    }
    await transactionDone(tx);

    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignore cleanup failures.
    }
    return true;
  } catch (error) {
    console.warn('[HistoryStore] Failed to migrate legacy history:', error);
    return false;
  }
}

export async function loadHistoryItemsWithMigration(): Promise<HistoryItem[]> {
  const existing = await loadHistoryItems();
  if (existing.length > 0) return existing;

  const migrated = await migrateLegacyHistoryFromLocalStorage();
  if (!migrated) return existing;

  return loadHistoryItems();
}
