/**
 * Storage Service with IndexedDB as primary store and localStorage as sync/fallback store.
 * Handles QuotaExceededError automatically and safely prevents crashes.
 */

const DB_NAME = 'AdventureForgeDB';
const DB_VERSION = 1;
const STORE_NAME = 'appData';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = () => {
      console.warn('IndexedDB failed to open, falling back to localStorage:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

export class StorageService {
  /**
   * Save item to IndexedDB asynchronously, and safely attempt localStorage sync.
   */
  static async setItem<T>(key: string, value: T): Promise<boolean> {
    const stringValue = JSON.stringify(value);

    // 1. Save to IndexedDB (Primary Store - high capacity)
    let idbSuccess = false;
    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(stringValue, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      idbSuccess = true;
    } catch (e) {
      console.warn(`IndexedDB setItem warning for key "${key}":`, e);
    }

    // 2. Safe save to localStorage (Fallback Store)
    try {
      localStorage.setItem(key, stringValue);
    } catch (e: any) {
      if (
        e instanceof DOMException &&
        (e.code === 22 || e.name === 'QuotaExceededError' || (e as any).number === -2147024882)
      ) {
        console.warn(`LocalStorage quota exceeded for key "${key}". Clearing non-essential keys or using IndexedDB.`);
        
        // Clear non-essential items to free up space
        this.clearNonEssentialLocalStorage(key);

        try {
          if (key === 'adventures' && Array.isArray(value)) {
            const trimmedAdventures = this.trimAdventuresForLocalStorage(value as any[]);
            localStorage.setItem(key, JSON.stringify(trimmedAdventures));
          } else {
            localStorage.setItem(key, stringValue);
          }
        } catch (_) {
          if (idbSuccess) {
            console.log(`Key "${key}" successfully saved in IndexedDB despite LocalStorage Quota limit.`);
          }
        }
      } else {
        console.warn(`LocalStorage setItem error for key "${key}":`, e);
      }
    }

    return idbSuccess;
  }

  /**
   * Get item asynchronously (IndexedDB first, then localStorage fallback)
   */
  static async getItem<T>(key: string): Promise<T | null> {
    // 1. Try IndexedDB
    try {
      const db = await getDB();
      const resultStr = await new Promise<string | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve((req.result as string) || null);
        req.onerror = () => reject(req.error);
      });

      if (resultStr !== null) {
        return JSON.parse(resultStr) as T;
      }
    } catch (e) {
      console.warn(`IndexedDB getItem failed for key "${key}", falling back to localStorage:`, e);
    }

    // 2. Fallback to localStorage
    try {
      const lsValue = localStorage.getItem(key);
      if (lsValue !== null) {
        const parsed = JSON.parse(lsValue) as T;
        // Migrate to IndexedDB in background
        this.setItem(key, parsed).catch(() => {});
        return parsed;
      }
    } catch (e) {
      console.warn(`LocalStorage getItem error for key "${key}":`, e);
    }

    return null;
  }

  /**
   * Synchronous getItem fallback for initial React state or synchronous calls
   */
  static getItemSync<T>(key: string): T | null {
    try {
      const lsValue = localStorage.getItem(key);
      if (lsValue) {
        return JSON.parse(lsValue) as T;
      }
    } catch (e) {
      console.warn(`LocalStorage getItemSync error for key "${key}":`, e);
    }
    return null;
  }

  /**
   * Remove item from both IndexedDB and localStorage
   */
  static async removeItem(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(key);
    } catch (_) {}

    try {
      const db = await getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      return true;
    } catch (e) {
      console.warn(`IndexedDB removeItem failed for key "${key}":`, e);
      return false;
    }
  }

  /**
   * Clean up non-essential items in localStorage to free up space
   */
  private static clearNonEssentialLocalStorage(currentKey: string) {
    const keysToRemove = [
      'onepiece_world_template',
      'adventure_forge_emotion_usage',
      'adventure_forge_tone_usage',
      'adventureforge_map_grid_sizes',
      'tag_selection_counts'
    ];

    for (const k of keysToRemove) {
      if (k !== currentKey) {
        try {
          localStorage.removeItem(k);
        } catch (_) {}
      }
    }
  }

  /**
   * Trims heavy objects when creating localStorage fallback for adventures
   */
  private static trimAdventuresForLocalStorage(adventures: any[]): any[] {
    return adventures.map(adv => {
      const clone = { ...adv };
      delete clone.initialPlayer;
      delete clone.initialNpcs;
      delete clone.initialLoreDatabase;
      delete clone.initialStructuredInventory;
      delete clone.initialStatusElements;
      return clone;
    });
  }
}
