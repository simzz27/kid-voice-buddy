import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { QARecord } from "../types";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * Logs each question/answer exchange to Firestore. This mirrors the kind of
 * structured interaction log the lab's own research (e.g. studies on
 * children's information-seeking and trust in AI) relies on to analyze
 * what kids ask and how they respond to AI answers over time.
 */
export async function logExchange(
  record: Omit<QARecord, "id">,
  sessionId: string
): Promise<void> {
  try {
    await addDoc(collection(db, "sessions", sessionId, "exchanges"), {
      ...record,
      loggedAt: serverTimestamp(),
    });
  } catch (err) {
    // Logging failures should never block the child's experience.
    console.error("Failed to log exchange:", err);
  }
}
