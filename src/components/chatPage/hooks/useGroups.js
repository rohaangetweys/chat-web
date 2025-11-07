'use client';
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function useGroups(username) {
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        if (!username) return;
        const groupsRef = ref(db, 'groupChats/');
        const unsub = onValue(groupsRef, (snapshot) => {
            const groupsList = [];
            snapshot.forEach((child) => {
                const groupData = child.val();
                if (groupData.members && groupData.members.includes(username)) {
                    groupsList.push({ id: child.key, name: groupData.groupName, createdBy: groupData.createdBy, members: groupData.members });
                }
            });
            setGroups(groupsList);
        });
        return () => unsub();
    }, [username]);

    return { groups };
}