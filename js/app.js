// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD0tqPPbxTFbkaGWIYAyZiKBUpNKtsgyzM",
  authDomain: "kanbanabsen.firebaseapp.com",
  projectId: "kanbanabsen",
  storageBucket: "kanbanabsen.appspot.com",
  messagingSenderId: "35963315784",
  appId: "1:35963315784:web:b5d3ec7a6e7a866629da7d",
  measurementId: "G-R7DKF3ZMGD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);