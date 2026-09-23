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

import { db, auth } from './firebaseService';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes `undefined` properties from an object/array
 * so that Firestore's setDoc/updateDoc doesn't fail with
 * "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === undefined) return null as any;
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)) as any;
  }

  const cleanObj: Record<string, any> = {};
  for (const key of Object.keys(obj as Record<string, any>)) {
    const val = (obj as Record<string, any>)[key];
    if (val !== undefined) {
      cleanObj[key] = sanitizeForFirestore(val);
    }
  }
  return cleanObj as T;
}

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

let firestoreWriteDisabled = false;
try {
  if (typeof window !== 'undefined' && window.sessionStorage?.getItem('firestore_quota_exceeded') === 'true') {
    firestoreWriteDisabled = true;
  }
} catch (_) {}

const syncDebounceTimers = new Map<string, any>();
const lastSyncedHashes = new Map<string, string>();

async function syncToFirestore<T>(key: string, value: T): Promise<void> {
  if (firestoreWriteDisabled || !auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const cleanValue = sanitizeForFirestore(value);

  try {
    if (key === 'adventures' && Array.isArray(cleanValue)) {
      const adventuresArray = cleanValue as any[];
      for (const adv of adventuresArray) {
        if (adv && adv.id) {
          const safeAdvId = String(adv.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
          const cleanAdv = sanitizeForFirestore(adv);
          const hashKey = `adv_${uid}_${safeAdvId}`;
          const currentHash = JSON.stringify(cleanAdv);

          if (lastSyncedHashes.get(hashKey) === currentHash) {
            // Unchanged since last sync, skip write to conserve quota
            continue;
          }

          const advDocRef = doc(db, 'users', uid, 'adventures', safeAdvId);
          await setDoc(advDocRef, { data: cleanAdv }, { merge: true });
          lastSyncedHashes.set(hashKey, currentHash);
        }
      }

      // Store a lightweight manifest document
      const rawManifest = adventuresArray.map(a => ({
        id: a?.id || '',
        storyTitle: a?.storyTitle || '',
        authorId: a?.authorId || '',
        updatedAt: a?.updatedAt || null
      }));
      const cleanManifest = sanitizeForFirestore(rawManifest);
      const manifestHashKey = `manifest_${uid}`;
      const manifestHash = JSON.stringify(cleanManifest);

      if (lastSyncedHashes.get(manifestHashKey) !== manifestHash) {
        const manifestRef = doc(db, 'users', uid, 'data', 'adventures_manifest');
        await setDoc(manifestRef, { data: cleanManifest }, { merge: true });
        lastSyncedHashes.set(manifestHashKey, manifestHash);
      }
    } else {
      const path = `users/${uid}/data/${key}`;
      const stringified = JSON.stringify(cleanValue);
      if (stringified.length < 900000) {
        const hashKey = `data_${uid}_${key}`;
        if (lastSyncedHashes.get(hashKey) === stringified) {
          // Unchanged, skip write
          return;
        }

        const userDocRef = doc(db, 'users', uid, 'data', key);
        await setDoc(userDocRef, { data: cleanValue }, { merge: true });
        lastSyncedHashes.set(hashKey, stringified);
      } else {
        console.warn(`Key "${key}" payload size (${stringified.length} chars) exceeds 900KB safety margin for single Firestore document. Skipping single-doc sync.`);
      }
    }
  } catch (e: any) {
    const errStr = e instanceof Error ? e.message : String(e);
    if (errStr.includes('resource-exhausted') || errStr.includes('Quota limit exceeded') || errStr.includes('Quota exceeded')) {
      firestoreWriteDisabled = true; // Circuit breaker: disable further Firestore writes for this session
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage?.setItem('firestore_quota_exceeded', 'true');
        }
      } catch (_) {}
      console.warn(
        `[Firestore Quota Protection] Daily write quota reached for Firestore. ` +
        `Application remains fully functional offline using local IndexedDB. ` +
        `Daily quota will reset tomorrow. Manage database upgrade: ` +
        `https://console.firebase.google.com/project/gen-lang-client-0680936141/firestore/databases/ai-studio-chat-9751ace7-c725-4cb4-9a2b-550876b20f0a/data?openUpgradeDialog=true`
      );
      return;
    }
    console.error(`Firestore sync failed for key "${key}":`, e);
  }
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

    // Debounced sync to Firestore to conserve write quota
    if (auth.currentUser) {
      if (syncDebounceTimers.has(key)) {
        clearTimeout(syncDebounceTimers.get(key));
      }
      const timer = setTimeout(() => {
        syncToFirestore(key, value).catch(() => {});
      }, 3000); // 3-second debounce window
      syncDebounceTimers.set(key, timer);
    }

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
   * Clears the in-memory cache for a specific key or all keys
   */
  static clearMemoryCache(key?: string) {
    if (key) {
      memoryCache.delete(key);
    } else {
      memoryCache.clear();
    }
  }

  /**
   * Get item asynchronously (Memory cache first, IndexedDB second, localStorage fallback third)
   */
  static async getItem<T>(key: string): Promise<T | null> {
    // 1. Check in-memory cache
    if (memoryCache.has(key)) {
      return memoryCache.get(key) as T;
    }

    // 2. Try Firestore if authenticated and remote operations are not circuit-broken by quota
    if (!firestoreWriteDisabled && auth.currentUser) {
      const uid = auth.currentUser.uid;

      if (key === 'adventures') {
        let adventuresFromFs: any[] = [];
        try {
          const advColRef = collection(db, 'users', uid, 'adventures');
          const querySnap = await getDocs(advColRef);
          if (!querySnap.empty) {
            querySnap.forEach(docSnap => {
              const d = docSnap.data();
              if (d && d.data) {
                adventuresFromFs.push(d.data);
              }
            });
          }
        } catch (e: any) {
          const errStr = e instanceof Error ? e.message : String(e);
          if (errStr.includes('resource-exhausted') || errStr.includes('Quota limit exceeded') || errStr.includes('Quota exceeded')) {
            firestoreWriteDisabled = true;
            try {
              window.sessionStorage?.setItem('firestore_quota_exceeded', 'true');
            } catch (_) {}
            console.warn('[Firestore Quota Protection] Quota limit exceeded on Firestore query. Bypassing Firestore for local IndexedDB.');
          } else {
            console.error(`Firestore getItem failed for adventures subcollection:`, e);
          }
        }

        // Also retrieve local IDB adventures to merge local offline work with remote
        let localAdventures: any[] = [];
        try {
          const dbInstance = await getDB();
          const transaction = dbInstance.transaction([STORE_NAME], 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.get(key);
          const localResult = await new Promise<any>((resolve) => {
            request.onsuccess = () => resolve(request.result?.value || null);
            request.onerror = () => resolve(null);
          });
          if (Array.isArray(localResult)) {
            localAdventures = localResult;
          }
        } catch (_) {}

        // Merge Firestore and Local IDB adventures by ID
        const advMap = new Map<string, any>();
        for (const adv of localAdventures) {
          if (adv && adv.id) {
            advMap.set(String(adv.id), { ...adv, authorId: adv.authorId || uid });
          }
        }
        for (const adv of adventuresFromFs) {
          if (adv && adv.id) {
            advMap.set(String(adv.id), { ...adv, authorId: adv.authorId || uid });
          }
        }

        const mergedAdventures = Array.from(advMap.values());
        if (mergedAdventures.length > 0) {
          memoryCache.set(key, mergedAdventures as any);
          return mergedAdventures as unknown as T;
        }
      }

      const path = `users/${uid}/data/${key}`;
      try {
        const userDocRef = doc(db, 'users', uid, 'data', key);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data().data as T;
          memoryCache.set(key, data);
          return data;
        }
      } catch (e) {
        console.error(`Firestore getItem failed for key "${key}":`, e);
        try {
          handleFirestoreError(e, OperationType.GET, path);
        } catch (_) {}
      }
    }

    // 3. Try IndexedDB (Primary store)
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

    if (!firestoreWriteDisabled && auth.currentUser) {
      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid, 'data', key);
        await deleteDoc(userDocRef);
      } catch (_) {}
    }

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

