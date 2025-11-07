'use client';
import { useEffect, useState } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebaseConfig';

export default function useProfiles(user) {
    const [users, setUsers] = useState([]);
    const [userProfiles, setUserProfiles] = useState({});
    const [onlineStatus, setOnlineStatus] = useState({});
    const [username, setUsername] = useState('');

    useEffect(() => {
        if (!user) return;
        const usersRef = ref(db, 'users');
        const unsub = onValue(usersRef, (snapshot) => {
            const list = [];
            const profiles = {};
            const status = {};
            let foundUsername = '';
            snapshot.forEach((child) => {
                const userData = child.val();
                profiles[child.key] = userData;
                status[child.key] = { online: userData.online || false, lastSeen: userData.lastSeen || null };
                if (userData.uid === user.uid) foundUsername = child.key;
                if (child.key && child.key !== foundUsername) list.push(child.key);
            });
            setUsers(list);
            setUserProfiles(prev => ({ ...prev, ...profiles }));
            setOnlineStatus(status);
            if (foundUsername) setUsername(foundUsername); else setUsername(user.displayName || (user.email ? user.email.split('@')[0] : ''));
        });

        return () => unsub();
    }, [user]);

    useEffect(() => {
        if (!username || !user) return;
        const userRef = ref(db, `users/${username}`);
        set(userRef, { uid: user?.uid, email: user?.email, username, profilePhoto: user?.photoURL, online: true, lastSeen: serverTimestamp() }, { merge: true }).catch((err) => console.error('failed to update user data:', err));
        const userStatusRef = ref(db, `users/${username}`);
        onDisconnect(userStatusRef).update({ online: false, lastSeen: serverTimestamp() });
        const usersRef = ref(db, 'users');
        const unsub = onValue(usersRef, (snapshot) => {
            const status = {};
            snapshot.forEach((child) => {
                const userData = child.val();
                status[child.key] = { online: userData.online || false, lastSeen: userData.lastSeen || null };
            });
            setOnlineStatus(status);
        });

        return () => { unsub(); onDisconnect(userStatusRef).cancel(); };
    }, [username, user]);

    useEffect(() => {
        const usersRef = ref(db, 'users/');
        const unsub = onValue(usersRef, (snapshot) => {
            const list = [];
            const profiles = {};
            snapshot.forEach((child) => {
                if (child.key && child.key !== username) { list.push(child.key); profiles[child.key] = child.val(); }
            });
            setUsers(list);
            setUserProfiles(prev => ({ ...prev, ...profiles }));
        });
        return () => unsub();
    }, [username]);

    return { users, userProfiles, onlineStatus, username, setUsername };
}
