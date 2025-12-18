
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isOfflineMode = false;

try {
  const configStr = process.env.FIREBASE_CONFIG;
  // 檢查是否為有效的 JSON 字串，避免 "undefined" 或空字串
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
    console.warn("Firebase config is empty or invalid. Running in Offline Mode.");
    isOfflineMode = true;
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
  isOfflineMode = true;
}

export { auth, db, isOfflineMode };
