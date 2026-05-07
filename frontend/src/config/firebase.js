import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Credenciais do projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB_xUt1d2n7h14i9yWHYlGohl3njag7g7A",
  authDomain: "fin-view-d7df8.firebaseapp.com",
  projectId: "fin-view-d7df8",
  storageBucket: "fin-view-d7df8.firebasestorage.app",
  messagingSenderId: "567336348022",
  appId: "1:567336348022:web:87c3f82efe3cd198e43257",
  measurementId: "G-QHN31QE2W6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
