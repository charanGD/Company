import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBMn_oeiFQj4Ax62RQAuqO8wzQJIJnmwTM",
  authDomain: "company-60343.firebaseapp.com",
  projectId: "company-60343",
  storageBucket: "company-60343.firebasestorage.app",
  messagingSenderId: "265033135595",
  appId: "1:265033135595:web:c64a53131a69550a52d5ae",
  measurementId: "G-8W5NZ7BBXV"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);