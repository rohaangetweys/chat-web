import { getDatabase } from "@firebase/database";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAqtVQ4_8Wu4MFYFhmBpuJvOMIOwCxJ31w",
    authDomain: "chat-app-d2b05.firebaseapp.com",
    databaseURL: "https://chat-app-d2b05-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "chat-app-d2b05",
    storageBucket: "chat-app-d2b05.firebasestorage.app",
    messagingSenderId: "158221550773",
    appId: "1:158221550773:web:8a044921a1ded515f7aafc"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export {
    firebaseConfig,
    db,
    auth,
    app
};