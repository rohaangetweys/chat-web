// Import the functions you need from the SDKs you need
import { getDatabase, ref, set, get } from "@firebase/database";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";

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

// Upload profile photo to Cloudinary
async function uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'chat_app_upload');
    formData.append('folder', 'profile_photos');

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/dh72bjbwy/image/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Profile photo upload error:', error);
        throw error;
    }
}

async function signup(email, password, username, profilePhoto = null) {
    try {
        // Check if username already exists
        const usernameRef = ref(db, `usernames/${username}`);
        const usernameSnapshot = await get(usernameRef);
        
        if (usernameSnapshot.exists()) {
            return { success: false, message: 'username-already-exists' };
        }

        // Upload profile photo if provided
        let profilePhotoUrl = null;
        if (profilePhoto) {
            try {
                profilePhotoUrl = await uploadProfilePhoto(profilePhoto);
            } catch (error) {
                console.error('Failed to upload profile photo:', error);
                // Continue without profile photo if upload fails
            }
        }

        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update user profile with photo URL if available
        if (profilePhotoUrl) {
            await updateProfile(user, {
                displayName: username,
                photoURL: profilePhotoUrl
            });
        } else {
            await updateProfile(user, {
                displayName: username
            });
        }

        // Store username in database for uniqueness check
        await set(ref(db, `usernames/${username}`), {
            uid: user.uid,
            email: email,
            createdAt: new Date().toISOString()
        });

        // Store user data with username and profile photo
        await set(ref(db, `users/${username}`), {
            uid: user.uid,
            email: email,
            username: username,
            profilePhoto: profilePhotoUrl,
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        });

        return { success: true, user: user };
    } catch (error) {
        // If signup fails, remove the username reservation
        if (error.code !== 'auth/email-already-in-use') {
            const usernameRef = ref(db, `usernames/${username}`);
            set(usernameRef, null).catch(console.error);
        }
        return { success: false, message: error.code };
    }
}

async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Update last seen timestamp
        const user = userCredential.user;
        const username = user.displayName || user.email.split("@")[0];
        
        // Try to update last seen, but don't fail if it doesn't work
        try {
            const userRef = ref(db, `users/${username}`);
            await set(userRef, {
                uid: user.uid,
                email: user.email,
                username: username,
                profilePhoto: user.photoURL,
                lastSeen: new Date().toISOString()
            }, { merge: true });
        } catch (dbError) {
            console.error('Error updating last seen:', dbError);
        }
        
        return { success: true, user: user };
    } catch (error) {
        return { success: false, message: error.code };
    }
}

function logout() {
    return signOut(auth).then(() => {
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