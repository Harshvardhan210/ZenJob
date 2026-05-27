import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBgPWcFzPb1WwXuGC-N7Dh_29xruHjAtug",
  authDomain: "zenjob-db.firebaseapp.com",
  projectId: "zenjob-db",
  storageBucket: "zenjob-db.firebasestorage.app",

  messagingSenderId: "150409536528",
  appId: "1:150409536528:web:91e38f15e16a0bc28d5695",
  measurementId: "G-M8GXHYW8C8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
