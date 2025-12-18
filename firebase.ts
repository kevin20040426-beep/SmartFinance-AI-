
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isOfflineMode = false;

try {
  const configStr = process.env.FIREBASE_CONFIG;
  if (configStr) {
    const firebaseConfig = JSON.parse(configStr);
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    console.warn("Firebase config not found. Running in Offline Mode.");
    isOfflineMode = true;
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
  isOfflineMode = true;
}

export { auth, db, isOfflineMode };
