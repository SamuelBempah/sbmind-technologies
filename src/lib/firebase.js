// Dead Deck accounts: Firebase Auth + Firestore.
// These values are the project's PUBLIC web configuration (they identify the project, they are not secrets).
// What protects the data is the Firestore security rules published in the Firebase console.
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAy141Xk42LAiVVS76JB2j9b-sYGAw8w9o',
  authDomain: 'dead-deck.firebaseapp.com',
  projectId: 'dead-deck',
  storageBucket: 'dead-deck.firebasestorage.app',
  messagingSenderId: '353195697196',
  appId: '1:353195697196:web:1909f747d547f31c5b5d89',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
