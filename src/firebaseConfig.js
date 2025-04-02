// Import Firebase SDK functions
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD-wgeql2gjtnoCRw5eXIjufvpFZSCQQEc",
    authDomain: "dolluzforms.firebaseapp.com",
    projectId: "dolluzforms",
    storageBucket: "dolluzforms.appspot.com",
    messagingSenderId: "724886498323",
    appId: "1:724886498323:web:c646c83b7480754cfa63e6",
    measurementId: "G-8FY93BY0M3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Export authentication functions
export { auth, provider, signInWithPopup };
