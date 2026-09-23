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
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, disableNetwork } from 'firebase/firestore';

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
  if (typeof window !== 'undefined') {
    const today = new Date().toISOString().split('T')[0];
    const storedQuotaDate = localStorage.getItem('firestore_quota_exceeded_date') || sessionStorage.getItem('firestore_quota_exceeded_date');
    if (storedQuotaDate === today || sessionStorage.getItem('firestore_quota_exceeded') === 'true') {
      firestoreWriteDisabled = true;
      disableNetwork(db).catch(() => {});
    }
  }
} catch (_) {}

function markQuotaExceeded() {
  firestoreWriteDisabled = true;
  try {
    disableNetwork(db).catch(() => {});
  } catch (_) {}
  try {
    if (typeof window !== 'undefined') {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('firestore_quota_exceeded_date', today);
      sessionStorage.setItem('firestore_quota_exceeded_date', today);
    }
  } catch (_) {}
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

    // 2. Primary Store: IndexedDB (High capacity, persistent across reloads)
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

    // 3. Secondary Store: LocalStorage for lightweight config objects
    if (idbSuccess) {
      if (stringValue.length <= MAX_LOCAL_STORAGE_CHAR_LENGTH) {
        try {
          localStorage.setItem(key, stringValue);
        } catch (_) {}
      } else {
        try {
          if (localStorage.getItem(key) !== null) {
            localStorage.removeItem(key);
          }
        } catch (_) {}
      }
    } else {
      try {
        localStorage.setItem(key, stringValue);
      } catch (e: any) {
        if (
          e instanceof DOMException &&
          (e.code === 22 || e.name === 'QuotaExceededError' || (e as any).number === -2147024882)
        ) {
          console.warn(`LocalStorage quota exceeded for key "${key}". Data is kept safe in memory.`);
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
   * Safe bidirectional synchronization between local IndexedDB and Firestore.
   * Triggered upon Google login or manual cloud backup.
   * NEVER overwrites newer local data with older cloud data,
   * and NEVER overwrites newer cloud data with older local data.
   */
  static async syncAllToFirestore(
    userId?: string,
    testOptions?: {
      cloudReader?: (targetUid: string) => Promise<any[]>;
      skipCloudWrite?: boolean;
    }
  ): Promise<{
    success: boolean;
    message: string;
    timestamp?: string;
    mergedAdventures?: any[];
  }> {
    const targetUid = userId || auth.currentUser?.uid;
    if (!targetUid) {
      return { success: false, message: 'Nicht angemeldet. Bitte mit Google anmelden.' };
    }

    if (firestoreWriteDisabled) {
      return {
        success: false,
        message: 'Tägliches Firestore-Quota erreicht. Lokale Spieldaten sind sicher im Browser gespeichert. Cloud-Backup pausiert bis zum täglichen Quota-Reset.'
      };
    }

    // 1. Load local adventures
    const localAdventures = (await this.getItem<any[]>('adventures')) || [];

    // 2. Fetch existing cloud adventures with strict error handling
    let cloudAdventures: any[] = [];
    try {
      if (testOptions?.cloudReader) {
        cloudAdventures = await testOptions.cloudReader(targetUid);
      } else {
        const advColRef = collection(db, 'users', targetUid, 'adventures');
        const querySnap = await getDocs(advColRef);
        if (!querySnap.empty) {
          querySnap.forEach(docSnap => {
            const d = docSnap.data();
            if (d && d.data && d.data.id) {
              cloudAdventures.push(d.data);
            }
          });
        }
      }
    } catch (err: any) {
      console.warn('Could not read existing cloud adventures:', err);
      const errStr = err instanceof Error ? err.message : String(err);
      if (errStr.includes('resource-exhausted') || errStr.includes('Quota limit exceeded') || errStr.includes('Quota exceeded')) {
        markQuotaExceeded();
        return {
          success: false,
          message: 'Tägliches Firestore-Quota erreicht. Lokale Daten bleiben vollständig und sicher im Browser erhalten.'
        };
      }
      return {
        success: false,
        message: 'Cloud-Daten konnten nicht gelesen werden. Lokale Daten wurden nicht verändert.'
      };
    }

    try {
      // 3. Reconcile adventure-by-adventure
      const { mergedAdventures, toUploadToCloud } = this.reconcileAdventures(localAdventures, cloudAdventures);

      // 4. Save merged adventures locally
      await this.setItem('adventures', mergedAdventures);

      // 5. Upload items needing cloud sync (skip in unit test if skipCloudWrite is set)
      if (!testOptions?.skipCloudWrite) {
        for (const adv of toUploadToCloud) {
          if (adv && adv.id) {
            const safeAdvId = String(adv.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
            const cleanAdv = sanitizeForFirestore(adv);
            const advDocRef = doc(db, 'users', targetUid, 'adventures', safeAdvId);
            await setDoc(advDocRef, { data: cleanAdv }, { merge: true });
          }
        }

        // 6. Update adventures manifest in cloud
        const rawManifest = mergedAdventures.map(a => ({
          id: a?.id || '',
          storyTitle: a?.storyTitle || a?.world?.title || '',
          authorId: a?.authorId || targetUid,
          updatedAt: a?.updatedAt || a?.lastSaved || new Date().toISOString()
        }));
        const cleanManifest = sanitizeForFirestore(rawManifest);
        const manifestRef = doc(db, 'users', targetUid, 'data', 'adventures_manifest');
        await setDoc(manifestRef, { data: cleanManifest }, { merge: true });

        // 7. Sync userProfile safely
        const localProfile = await this.getItem<any>('userProfile');
        if (localProfile) {
          try {
            const profileRef = doc(db, 'users', targetUid, 'data', 'userProfile');
            const cloudProfileSnap = await getDoc(profileRef);
            let profileToKeep = localProfile;
            if (cloudProfileSnap.exists()) {
              const cloudProfData = cloudProfileSnap.data()?.data;
              if (cloudProfData) {
                const localProfTs = new Date(localProfile.updatedAt || 0).getTime();
                const cloudProfTs = new Date(cloudProfData.updatedAt || 0).getTime();
                if (cloudProfTs > localProfTs) {
                  profileToKeep = cloudProfData;
                  await this.setItem('userProfile', cloudProfData);
                }
              }
            }
            if (profileToKeep === localProfile) {
              const cleanProfile = sanitizeForFirestore(localProfile);
              await setDoc(profileRef, { data: cleanProfile }, { merge: true });
            }
          } catch (err) {
            console.warn('Profile sync fallback:', err);
          }
        }
      }

      const now = new Date().toLocaleString('de-DE');
      try {
        localStorage.setItem('last_cloud_backup_time', now);
      } catch (_) {}

      return {
        success: true,
        message: `Synchronisation erfolgreich (${mergedAdventures.length} Abenteuer abgeglichen).`,
        timestamp: now,
        mergedAdventures
      };
    } catch (e: any) {
      const errStr = e instanceof Error ? e.message : String(e);
      if (errStr.includes('resource-exhausted') || errStr.includes('Quota limit exceeded') || errStr.includes('Quota exceeded')) {
        markQuotaExceeded();
        return {
          success: false,
          message: 'Tägliches Firestore-Quota erreicht. Lokale Daten bleiben vollständig und sicher im Browser erhalten.'
        };
      }
      return { success: false, message: `Cloud-Synchronisation fehlgeschlagen: ${errStr}` };
    }
  }

  /**
   * Pure reconciliation algorithm between local and cloud adventures.
   */
  static reconcileAdventures(localAdventures: any[], cloudAdventures: any[]): {
    mergedAdventures: any[];
    toUploadToCloud: any[];
  } {
    const localMap = new Map<string, any>();
    if (Array.isArray(localAdventures)) {
      for (const a of localAdventures) {
        if (a && a.id) {
          localMap.set(String(a.id), a);
        }
      }
    }

    const cloudMap = new Map<string, any>();
    if (Array.isArray(cloudAdventures)) {
      for (const a of cloudAdventures) {
        if (a && a.id) {
          cloudMap.set(String(a.id), a);
        }
      }
    }

    const allIds = new Set<string>([...localMap.keys(), ...cloudMap.keys()]);
    const mergedAdventures: any[] = [];
    const toUploadToCloud: any[] = [];

    for (const id of allIds) {
      const localAdv = localMap.get(id);
      const cloudAdv = cloudMap.get(id);

      if (localAdv && !cloudAdv) {
        // Exists only locally -> Upload to cloud
        mergedAdventures.push(localAdv);
        toUploadToCloud.push(localAdv);
      } else if (!localAdv && cloudAdv) {
        // Exists only in cloud -> Add to local
        mergedAdventures.push(cloudAdv);
      } else if (localAdv && cloudAdv) {
        // Exists in both -> Timestamp & version comparison!
        const localTs = this.getAdventureTimestamp(localAdv);
        const cloudTs = this.getAdventureTimestamp(cloudAdv);
        const localHistoryLen = Array.isArray(localAdv.storyHistory) ? localAdv.storyHistory.length : 0;
        const cloudHistoryLen = Array.isArray(cloudAdv.storyHistory) ? cloudAdv.storyHistory.length : 0;

        if (cloudTs > localTs) {
          // Cloud is newer -> Cloud wins, update local
          mergedAdventures.push(cloudAdv);
        } else if (localTs > cloudTs) {
          // Local is newer -> Local wins, upload to cloud
          mergedAdventures.push(localAdv);
          toUploadToCloud.push(localAdv);
        } else {
          // Timestamps equal: tie break by story history length
          if (cloudHistoryLen > localHistoryLen) {
            mergedAdventures.push(cloudAdv);
          } else {
            mergedAdventures.push(localAdv);
            if (localHistoryLen > cloudHistoryLen) {
              toUploadToCloud.push(localAdv);
            }
          }
        }
      }
    }

    return { mergedAdventures, toUploadToCloud };
  }

  static getAdventureTimestamp(adv: any): number {
    if (!adv) return 0;
    const tsStr = adv.updatedAt || adv.lastSaved || adv.createdAt;
    if (tsStr) {
      const t = new Date(tsStr).getTime();
      if (!isNaN(t)) return t;
    }
    return 0;
  }

  /**
   * Pulls saved adventures from Firestore if local IndexedDB is empty (e.g. on new device).
   */
  static async restoreFromFirestore(targetUid: string): Promise<any[] | null> {
    if (firestoreWriteDisabled) return null;
    try {
      const advColRef = collection(db, 'users', targetUid, 'adventures');
      const querySnap = await getDocs(advColRef);
      if (!querySnap.empty) {
        const adventuresFromFs: any[] = [];
        querySnap.forEach(docSnap => {
          const d = docSnap.data();
          if (d && d.data) {
            adventuresFromFs.push(d.data);
          }
        });
        if (adventuresFromFs.length > 0) {
          const localAdvs = (await this.getItem<any[]>('adventures')) || [];
          if (!Array.isArray(localAdvs) || localAdvs.length === 0) {
            await this.setItem('adventures', adventuresFromFs);
            return adventuresFromFs;
          } else {
            // Reconcile safely using syncAllToFirestore
            const syncRes = await this.syncAllToFirestore(targetUid);
            return syncRes.mergedAdventures || localAdvs;
          }
        }
      }
    } catch (e: any) {
      const errStr = e instanceof Error ? e.message : String(e);
      if (errStr.includes('resource-exhausted') || errStr.includes('Quota limit exceeded') || errStr.includes('Quota exceeded')) {
        markQuotaExceeded();
      }
    }
    return null;
  }

  /**
   * Get item asynchronously.
   * Priority:
   * 1. In-memory cache (instant)
   * 2. IndexedDB (primary persistent browser store)
   * 3. LocalStorage (legacy fallback)
   * 4. Firestore (ONLY if local is completely empty and user is logged in)
   */
  static async getItem<T>(key: string): Promise<T | null> {
    // 1. Check in-memory cache
    if (memoryCache.has(key)) {
      return memoryCache.get(key) as T;
    }

    // 2. Try IndexedDB (Primary persistent browser store)
    try {
      const dbInstance = await getDB();
      const resultStr = await new Promise<string | null>((resolve, reject) => {
        const tx = dbInstance.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => {
          const val = req.result;
          if (typeof val === 'string') {
            resolve(val);
          } else if (val !== undefined && val !== null) {
            resolve(JSON.stringify(val));
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });

      if (resultStr !== null) {
        try {
          const parsed = JSON.parse(resultStr) as T;
          memoryCache.set(key, parsed);

          if (resultStr.length > MAX_LOCAL_STORAGE_CHAR_LENGTH) {
            try {
              if (localStorage.getItem(key) !== null) {
                localStorage.removeItem(key);
              }
            } catch (_) {}
          }

          return parsed;
        } catch (parseErr) {
          console.warn(`JSON parse error for IndexedDB key "${key}":`, parseErr);
        }
      }
    } catch (e) {
      console.warn(`IndexedDB getItem failed for key "${key}", falling back to localStorage:`, e);
    }

    // 3. Fallback to localStorage (and migrate to IndexedDB if found)
    try {
      const lsValue = localStorage.getItem(key);
      if (lsValue !== null) {
        try {
          const parsed = JSON.parse(lsValue) as T;
          memoryCache.set(key, parsed);
          this.setItem(key, parsed).catch(() => {});
          return parsed;
        } catch (_) {}
      }
    } catch (e) {
      console.warn(`LocalStorage getItem error for key "${key}":`, e);
    }

    // 4. Fallback: If local storage has NO data for this key AND user is logged in, try cloud restore
    if (!firestoreWriteDisabled && auth.currentUser) {
      const uid = auth.currentUser.uid;
      try {
        if (key === 'adventures') {
          const restored = await this.restoreFromFirestore(uid);
          if (restored && restored.length > 0) {
            return restored as unknown as T;
          }
        } else {
          const userDocRef = doc(db, 'users', uid, 'data', key);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data().data as T;
            if (data !== undefined && data !== null) {
              await this.setItem(key, data);
              return data;
            }
          }
        }
      } catch (e) {
        const errStr = e instanceof Error ? e.message : String(e);
        if (errStr.includes('resource-exhausted') || errStr.includes('Quota limit exceeded') || errStr.includes('Quota exceeded')) {
          markQuotaExceeded();
        }
      }
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

