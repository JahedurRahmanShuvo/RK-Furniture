import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import appletConfig from "../firebase-applet-config.json";

// We prefer the AI Studio applet configuration for perfect rules deployment and syncing
export const firebaseConfig = appletConfig || {
  apiKey: "AIzaSyDfuSipIqlV69-bzFg24F52DLf6GR7PYwQ",
  authDomain: "rk-furniture-e0b7e.firebaseapp.com",
  projectId: "rk-furniture-e0b7e",
  storageBucket: "rk-furniture-e0b7e.firebasestorage.app",
  messagingSenderId: "396188287069",
  appId: "1:396188287069:web:bb1150bb693cd6b72c8db4",
  measurementId: "G-7V079KPE44"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

// Safe initialization of Analytics only in browser environment
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) {
      getAnalytics(app);
    }
  });
}

