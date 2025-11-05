// Import the functions you need from the SDKs you need
import { getDatabase } from "@firebase/database";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAqtVQ4_8Wu4MFYFhmBpuJvOMIOwCxJ31w",
    authDomain: "chat-app-d2b05.firebaseapp.com",
    databaseURL: "https://chat-app-d2b05-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "chat-app-d2b05",
    storageBucket: "chat-app-d2b05.firebasestorage.app",
    messagingSenderId: "158221550773",
    appId: "1:158221550773:web:8a044921a1ded515f7aafc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);


async function signup(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, message: error.code };
    }
}


async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, message: error.code };
    }
}


function logout() {
    signOut(auth).then(() => {
        return { success: true, message: 'logged out successfully' };
    }).catch((error) => {
        return { success: false, message: error.code };
    });
}




export {
    firebaseConfig,
    db,
    auth,
    app,
    signup,
    login,
    logout
}