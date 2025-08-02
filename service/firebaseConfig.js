// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAdMnrksl2fzIT-xYXVjdsIQjTVAahFtbI",
  authDomain: "braid-on-call.firebaseapp.com",
  projectId: "braid-on-call",
  storageBucket: "braid-on-call.firebasestorage.app",
  messagingSenderId: "210193830331",
  appId: "1:210193830331:web:c30f15f97245d193edf49e",
  measurementId: "G-0VH5SCBPTR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);