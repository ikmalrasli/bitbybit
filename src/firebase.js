// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyA-n1tc08oL-pk4sQb4dpMDUH4rGMJV2f8",
    authDomain: "bitbybit-5afe4.firebaseapp.com",
    projectId: "bitbybit-5afe4",
    storageBucket: "bitbybit-5afe4.appspot.com",
    messagingSenderId: "835507165219",
    appId: "1:835507165219:web:4f428ca23e35c49d5f3996",
    measurementId: "G-7K2Z8EEE8R"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };
