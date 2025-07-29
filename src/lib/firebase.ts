
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, indexedDBLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD0N_lwtTGfRwxCL2EMVMIPG62FMCn_tco",
  authDomain: "triad-scoring-system.firebaseapp.com",
  projectId: "triad-scoring-system",
  storageBucket: "triad-scoring-system.firebasestorage.app",
  messagingSenderId: "1043121641751",
  appId: "1:1043121641751:web:268ee8a85356a315eeff52",
  measurementId: "G-FGKBLBFZ45"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initialize Auth with persistence
export const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence
});


// Initialize Analytics only in the browser
if (typeof window !== 'undefined') {
  getAnalytics(app);
}
