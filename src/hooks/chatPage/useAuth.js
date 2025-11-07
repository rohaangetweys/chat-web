'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { logout } from '@/lib/firebase/firebaseServices';
import { auth } from '@/lib/firebase/firebaseConfig';

export default function useAuth() {
    const [user, setUser] = useState(null);
    const [authChecking, setAuthChecking] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setAuthChecking(false);
            } else {
                setUser(null);
                setAuthChecking(false);
            }
        });
        return () => unsubscribe && unsubscribe();
    }, []);

    const handleLogout = async () => {
        const res = await logout();
        return res;
    };

    return { user, authChecking, handleLogout };
}