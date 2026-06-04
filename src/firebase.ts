import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import appletConfig from "../firebase-applet-config.json";

// Dynamic configuration matching active platform environment
export const firebaseConfig = {
  apiKey: appletConfig.apiKey || "AIzaSyDBS2NnE8tEgzsRFBJXHpQchG_2b203iYo",
  authDomain: appletConfig.authDomain || "double-proposal-ck9gj.firebaseapp.com",
  projectId: appletConfig.projectId || "double-proposal-ck9gj",
  storageBucket: appletConfig.storageBucket || "double-proposal-ck9gj.firebasestorage.app",
  messagingSenderId: appletConfig.messagingSenderId || "764747904352",
  appId: appletConfig.appId || "1:764747904352:web:19abf4cc46ac3c9bf0da05",
  measurementId: appletConfig.measurementId || ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use the explicit Firestore Database ID from configuration
export const db = appletConfig.firestoreDatabaseId 
  ? getFirestore(app, appletConfig.firestoreDatabaseId)
  : getFirestore(app);

// Safe initialization of Analytics only in browser environment
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) {
      getAnalytics(app);
    }
  });
}

