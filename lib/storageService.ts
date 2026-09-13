/**
 * Storage Service with IndexedDB as primary store and localStorage as safe fallback store.
 * - Stores large payloads (like adventures, world state, lore, images) in IndexedDB (virtually unlimited capacity).
 * - Maintains an in-memory cache so synchronous calls (getItemSync) get full, intact data instantly.
 * - Never deletes non-essential keys (templates, tag selections, map configurations).
 * - Never strips or corrupts adventure properties.
 * - Frees old, bloated keys from localStorage to prevent QuotaExceededError while keeping all data safe in IndexedDB.
 */

const DB_NAME = 'AdventureForgeDB';
const DB_VERSION = 1;
const STORE_NAME = 'appData';

// Maximum payload size (in characters) to mirror to localStorage.
// localStorage has a 5MB domain limit. Large items (>200KB) live in IndexedDB and memoryCache.
const MAX_LOCAL_STORAGE_CHAR_LENGTH = 200 * 1024; // 200 KB

let dbPromise: Promise<IDBDatabase> | null = null;
const memoryCache = new Map<string, any>();

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
   * Save item to IndexedDB asynchronously, keeping an in-memory cache and
   * selectively updating localStorage for small configuration objects.
   * Completely avoids QuotaExceededError without deleting any relevant user data.
   */
  static async setItem<T>(key: string, value: T): Promise<boolean> {
    // 1. Immediate in-memory cache update for zero-latency synchronous reads
    memoryCache.set(key, value);

    const stringValue = JSON.stringify(value);

    // 2. Primary Store: IndexedDB (High capacity, handles large images, lore & adventures)
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

    // 3. Fallback / Secondary Store: LocalStorage
    // If IndexedDB succeeded:
    // - Small items (<= 200KB) are mirrored to localStorage as secondary backup.
    // - Large items (> 200KB, e.g. adventures) are NOT stored in localStorage to prevent 5MB quota exhaustion.
    //   Instead, if an old bulky version exists in localStorage from older versions, we safely remove it
    //   from localStorage to free up the 5MB quota for other settings!
    if (idbSuccess) {
      if (stringValue.length <= MAX_LOCAL_STORAGE_CHAR_LENGTH) {
        try {
          localStorage.setItem(key, stringValue);
        } catch (_) {
          // If localStorage is restricted or full, data is already safely stored in IndexedDB.
        }
      } else {
        // Large item stored safely in IndexedDB: clean legacy bloated copy from localStorage if present
        try {
          if (localStorage.getItem(key) !== null) {
            localStorage.removeItem(key);
          }
        } catch (_) {}
      }
    } else {
      // IndexedDB was unavailable or failed: Attempt best-effort localStorage save without deleting other keys
      try {
        localStorage.setItem(key, stringValue);
      } catch (e: any) {
        if (
          e instanceof DOMException &&
          (e.code === 22 || e.name === 'QuotaExceededError' || (e as any).number === -2147024882)
        ) {
          console.warn(`LocalStorage quota exceeded for key "${key}" while IndexedDB is unavailable. Data is kept in memory.`);
        } else {
          console.warn(`LocalStorage setItem error for key "${key}":`, e);
        }
      }
    }

    return idbSuccess;
  }

  /**
   * Get item asynchronously (Memory cache first, IndexedDB second, localStorage fallback third)
   */
  static async getItem<T>(key: string): Promise<T | null> {
    // 1. Check in-memory cache
    if (memoryCache.has(key)) {
      return memoryCache.get(key) as T;
    }

    // 2. Try IndexedDB (Primary store)
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
        const parsed = JSON.parse(resultStr) as T;
        memoryCache.set(key, parsed);

        // If a huge legacy copy still lingered in localStorage, remove it to reclaim 5MB space
        if (resultStr.length > MAX_LOCAL_STORAGE_CHAR_LENGTH) {
          try {
            if (localStorage.getItem(key) !== null) {
              localStorage.removeItem(key);
            }
          } catch (_) {}
        }

        return parsed;
      }
    } catch (e) {
      console.warn(`IndexedDB getItem failed for key "${key}", falling back to localStorage:`, e);
    }

    // 3. Fallback to localStorage (and migrate to IndexedDB if found)
    try {
      const lsValue = localStorage.getItem(key);
      if (lsValue !== null) {
        const parsed = JSON.parse(lsValue) as T;
        memoryCache.set(key, parsed);
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
   * Synchronous getItem fallback.
   * Prioritizes in-memory cache (so untrimmed, full objects like adventures can be read synchronously),
   * then falls back to localStorage.
   */
  static getItemSync<T>(key: string): T | null {
    if (memoryCache.has(key)) {
      return memoryCache.get(key) as T;
    }

    try {
      const lsValue = localStorage.getItem(key);
      if (lsValue) {
        const parsed = JSON.parse(lsValue) as T;
        memoryCache.set(key, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn(`LocalStorage getItemSync error for key "${key}":`, e);
    }
    return null;
  }

  /**
   * Remove item from memory, IndexedDB, and localStorage
   */
  static async removeItem(key: string): Promise<boolean> {
    memoryCache.delete(key);

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
   * Diagnostic method to inspect storage capacity and health.
   */
  static async getStorageDiagnostics(): Promise<{
    indexedDBAvailable: boolean;
    estimatedQuotaBytes?: number;
    estimatedUsageBytes?: number;
    cachedKeysCount: number;
    localStorageEstimatedUsedBytes: number;
  }> {
    let indexedDBAvailable = false;
    try {
      await getDB();
      indexedDBAvailable = true;
    } catch (_) {}

    let estimatedQuotaBytes: number | undefined;
    let estimatedUsageBytes: number | undefined;
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        estimatedQuotaBytes = estimate.quota;
        estimatedUsageBytes = estimate.usage;
      } catch (_) {}
    }

    let localStorageEstimatedUsedBytes = 0;
    if (typeof localStorage !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k) {
            const v = localStorage.getItem(k);
            localStorageEstimatedUsedBytes += (k.length + (v?.length || 0)) * 2;
          }
        }
      } catch (_) {}
    }

    return {
      indexedDBAvailable,
      estimatedQuotaBytes,
      estimatedUsageBytes,
      cachedKeysCount: memoryCache.size,
      localStorageEstimatedUsedBytes
    };
  }

  /**
   * Preload critical data on startup so memoryCache is instantly hot.
   */
  static async init(): Promise<void> {
    try {
      await this.getItem('adventures');
      await this.getItem('userProfile');
    } catch (_) {}
  }
}

// Auto-warm memoryCache in the background
if (typeof window !== 'undefined') {
  StorageService.init().catch(() => {});
}

