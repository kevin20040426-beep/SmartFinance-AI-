
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isOfflineMode = false;

const configStr = process.env.FIREBASE_CONFIG;

try {
  if (configStr && configStr !== "undefined" && configStr.trim() !== "") {
    const firebaseConfig = JSON.parse(configStr);
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } else {
    console.warn("No valid FIREBASE_CONFIG found. Operating in local-only demo mode.");
    isOfflineMode = true;
  }
} catch (error) {
  console.error("Firebase initialization failed. Falling back to offline mode:", error);
  isOfflineMode = true;
}

export { auth, db, isOfflineMode };
