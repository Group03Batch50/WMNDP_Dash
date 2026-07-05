import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDqf0SaSFmZdcjUXLCLMc1XyBOMw7ghHgA",
  authDomain: "wmndp-e8eb3.firebaseapp.com",
  databaseURL: "https://wmndp-e8eb3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wmndp-e8eb3",
  storageBucket: "wmndp-e8eb3.firebasestorage.app",
  messagingSenderId: "466669450433",
  appId: "1:466669450433:web:8330c1bb40332c546a5040",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);