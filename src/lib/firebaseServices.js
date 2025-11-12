import { ref, set, get, serverTimestamp, onDisconnect } from "@firebase/database";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { auth, db } from "./firebaseConfig";


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
        const usernameRef = ref(db, `usernames/${username}`);
        const usernameSnapshot = await get(usernameRef);

        if (usernameSnapshot.exists()) {
            return { success: false, message: 'username-already-exists' };
        }

        let profilePhotoUrl = null;
        if (profilePhoto) {
            try {
                profilePhotoUrl = await uploadProfilePhoto(profilePhoto);
            } catch (error) {
                console.error('Failed to upload profile photo:', error);
            }
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

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

        await set(ref(db, `usernames/${username}`), {
            uid: user.uid,
            email: email,
            createdAt: new Date().toISOString()
        });

        await set(ref(db, `users/${username}`), { 
            uid: user.uid, 
            email: email, 
            username: username, 
            profilePhoto: profilePhotoUrl, 
            createdAt: new Date().toISOString(), 
            lastSeen: serverTimestamp(), 
            online: true 
        });

        return { success: true, user: user };
    } catch (error) {
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

        const user = userCredential.user;
        const username = user.displayName || user.email.split("@")[0];

        try {
            const userRef = ref(db, `users/${username}`);
            await set(userRef, {
                uid: user.uid,
                email: user.email,
                username: username,
                profilePhoto: user.photoURL,
                lastSeen: serverTimestamp(),
                online: true
            }, { merge: true });
        } catch (dbError) {
            console.error('Error updating user status:', dbError);
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
    signup,
    login,
    logout,
    uploadProfilePhoto,
    serverTimestamp,
    onDisconnect
};