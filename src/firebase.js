// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBuIWuS-F79YwwXeCYOrKwDHT8zaQRSTMg",
    authDomain: "binder-ec61c.firebaseapp.com",
    projectId: "binder-ec61c",
    storageBucket: "binder-ec61c.firebasestorage.app",
    messagingSenderId: "1029336492122",
    appId: "1:1029336492122:web:6c6dbc8ce79e16d96d1063"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // ✅ Firestore