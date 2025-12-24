import { HistoryItem } from '../types';

const DB_NAME = 'oddoneout-custom-records';
const DB_VERSION = 1;
const STORE_NAME = 'customRecords';

let dbPromise: Promise<IDBDatabase> | null = null;

async function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });

  return dbPromise;
}

export async function loadCustomRecords(): Promise<HistoryItem[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const items: HistoryItem[] = [];
      const request = index.openCursor(null, 'prev');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          items.push(cursor.value as HistoryItem);
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve(items);
    });
  } catch {
    return [];
  }
}

export async function saveCustomRecord(item: HistoryItem): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(item);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('[CustomRecordStore] Failed to save:', e);
  }
}

export async function deleteCustomRecord(id: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('[CustomRecordStore] Failed to delete:', e);
  }
}

export async function findCustomRecordMatch(inputImageSrc: string): Promise<HistoryItem | null> {
  try {
    const records = await loadCustomRecords();
    for (const record of records) {
      if (record.originalImageSrc && record.originalImageSrc === inputImageSrc) {
        return record;
      }
    }
    return null;
  } catch {
    return null;
  }
}
