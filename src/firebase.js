import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// These should be moved to .env in a real production environment
const firebaseConfig = {
  apiKey: "AIzaSyDvDLfxp3UuK60FJilmOzdOkJBvgIa7t58",
  authDomain: "edurep-6d402.firebaseapp.com",
  projectId: "edurep-6d402",
  storageBucket: "edurep-6d402.firebasestorage.app",
  messagingSenderId: "32075309810",
  appId: "1:32075309810:web:8c766cca2d6e669043a66b",
  measurementId: "G-G0D99J283W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
