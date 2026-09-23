import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, setLogLevel, disableNetwork } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence internal Firestore SDK log spam (prevents retry backoff logs from triggering false fatal crash alerts in Studio)
try {
  setLogLevel('silent');
} catch (_) {}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Check if daily quota was already recorded as exceeded
if (typeof window !== 'undefined') {
  try {
    const today = new Date().toISOString().split('T')[0];
    const isQuotaExceeded =
      localStorage.getItem('firestore_quota_exceeded_date') === today ||
      sessionStorage.getItem('firestore_quota_exceeded_date') === today ||
      sessionStorage.getItem('firestore_quota_exceeded') === 'true';

    if (isQuotaExceeded) {
      disableNetwork(db).catch(() => {});
    }
  } catch (_) {}
}

export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged, disableNetwork };
