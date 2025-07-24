
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAo8ekS_p-2_v1a-2-4-d-2-c-3-b-d-d-9-1-f-4-d-4-d-d-b-c-d-a-f-c-e-f-d-b-c-e-f-d",
  authDomain: "triad-scoring-system.firebaseapp.com",
  projectId: "triad-scoring-system",
  storageBucket: "triad-scoring-system.appspot.com",
  messagingSenderId: "1043121641751",
  appId: "1:1043121641751:web:268ee8a85356a315eeff52",
  measurementId: "G-FGKBLBFZ45"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
