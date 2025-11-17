'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ref, onValue, off, remove, get } from 'firebase/database';
import { db } from '@/lib/firebaseConfig';

export default function useChatStateAndListeners({ username, users, groups, setShowSidebar }) {
    const [activeUser, setActiveUser] = useState('');
    const [activeChatType, setActiveChatType] = useState('individual');
    const [chat, setChat] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [isMobileView, setIsMobileView] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [showFileTypeModal, setShowFileTypeModal] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [clearedChats, setClearedChats] = useState({});

    const fileInputRef = useRef(null);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobileView(mobile);
            if (mobile && activeUser) {
                if (setShowSidebar) {
                    setShowSidebar(false);
                }
            } else {
                if (setShowSidebar) {
                    setShowSidebar(true);
                }
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [activeUser, setShowSidebar]);

    useEffect(() => {
        if (!username) return;

        const blockedUsersRef = ref(db, `blockedUsers/${username}`);
        const unsub = onValue(blockedUsersRef, (snapshot) => {
            if (snapshot.exists()) {
                const blockedList = [];
                snapshot.forEach((child) => {
                    blockedList.push(child.key);
                });
                setBlockedUsers(blockedList);
            } else {
                setBlockedUsers([]);
            }
        });

        return () => unsub();
    }, [username]);

    useEffect(() => {
        if (!username) return;

        const clearedChatsRef = ref(db, `clearedChats/${username}`);
        const unsub = onValue(clearedChatsRef, (snapshot) => {
            if (snapshot.exists()) {
                const clearedData = {};
                snapshot.forEach((child) => {
                    clearedData[child.key] = child.val();
                });
                setClearedChats(clearedData);
            } else {
                setClearedChats({});
            }
        });

        return () => unsub();
    }, [username]);

    useEffect(() => {
        if (!activeUser || !username) {
            setChat([]);
            return;
        }

        if (activeChatType === 'individual' && blockedUsers.includes(activeUser)) {
            setChat([]);
            return;
        }

        let chatRef;
        if (activeChatType === 'individual') {
            const chatId = username < activeUser ? `${username}_${activeUser}` : `${activeUser}_${username}`;
            chatRef = ref(db, `chats/${chatId}`);
        } else {
            chatRef = ref(db, `groupChats/${activeUser}/messages`);
        }

        const unsub = onValue(chatRef, (snapshot) => {
            if (!snapshot.exists()) {
                setChat([]);
                return;
            }

            const msgs = [];
            const clearedKey = activeChatType === 'individual' ? activeUser : `group_${activeUser}`;
            const clearTimestamp = clearedChats[clearedKey] || 0;

            snapshot.forEach((child) => {
                const msgData = child.val();
                if (msgData.timestamp > clearTimestamp) {
                    msgs.push({ id: child.key, ...msgData });
                }
            });

            msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            setChat(msgs);

            markMessagesAsRead(activeUser, activeChatType);
        }, (error) => {
            console.error('Error in chat listener:', error);
        });

        return () => {
            unsub();
        };
    }, [activeUser, username, activeChatType, blockedUsers, clearedChats]);

    useEffect(() => {
        if (!username) return;

        const unsubscribeFunctions = [];

        const initialUnreadCounts = {};
        users?.forEach(user => {
            if (user !== username && !blockedUsers.includes(user)) initialUnreadCounts[user] = 0;
        });
        groups?.forEach(group => {
            const gid = typeof group === 'string' ? group : group?.id;
            if (gid) initialUnreadCounts[gid] = 0;
        });
        setUnreadCounts(initialUnreadCounts);

        users?.forEach((user) => {
            if (user === username || blockedUsers.includes(user)) return;

            const chatId = username < user ? `${username}_${user}` : `${user}_${username}`;
            const chatRef = ref(db, `chats/${chatId}`);

            const unsubscribe = onValue(chatRef, (snapshot) => {
                if (!snapshot.exists()) {
                    setUnreadCounts(prev => ({ ...prev, [user]: 0 }));
                    return;
                }

                const messages = [];
                const clearedTimestamp = clearedChats[user] || 0;

                snapshot.forEach(child => {
                    const msgData = child.val();
                    if (msgData.timestamp > clearedTimestamp) {
                        messages.push({ id: child.key, ...msgData, timestamp: msgData.timestamp ?? 0 });
                    }
                });

                messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

                const lastReadKey = `lastRead_${username}_${user}`;
                const lastRead = Number(localStorage.getItem(lastReadKey) || 0);

                const unread = messages.filter(msg =>
                    (msg.timestamp || 0) > lastRead &&
                    msg.username !== username
                ).length;

                setUnreadCounts(prev => ({ ...prev, [user]: unread }));
            }, (error) => {
                console.error(`Error listening to chat with ${user}:`, error);
            });

            unsubscribeFunctions.push(unsubscribe);
        });

        groups?.forEach((group) => {
            const groupId = typeof group === 'string' ? group : group?.id;
            if (!groupId) return;

            const messagesRef = ref(db, `groupChats/${groupId}/messages`);

            const unsubscribe = onValue(messagesRef, (snapshot) => {
                if (!snapshot.exists()) {
                    setUnreadCounts(prev => ({ ...prev, [groupId]: 0 }));
                    return;
                }

                const messages = [];
                const clearedTimestamp = clearedChats[`group_${groupId}`] || 0;

                snapshot.forEach((child) => {
                    const msgData = child.val();
                    if (msgData.timestamp > clearedTimestamp) {
                        messages.push({ id: child.key, ...msgData, timestamp: msgData.timestamp ?? 0 });
                    }
                });

                messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

                const lastReadKey = `lastRead_${username}_${groupId}`;
                const lastRead = Number(localStorage.getItem(lastReadKey) || 0);

                const unread = messages.filter(msg => {
                    const isUnread = (msg.timestamp || 0) > lastRead;
                    const isFromOthers = msg.username !== username;
                    return isUnread && isFromOthers;
                }).length;

                setUnreadCounts(prev => ({ ...prev, [groupId]: unread }));
            }, (error) => {
                console.error(`Error listening to group ${groupId}:`, error);
            });

            unsubscribeFunctions.push(unsubscribe);
        });

        return () => {
            unsubscribeFunctions.forEach(unsub => unsub && unsub());
        };
    }, [users, groups, username, blockedUsers, clearedChats]);

    const markMessagesAsRead = useCallback((target, type = 'individual') => {
        if (!username || !target) return;

        const lastReadKey = `lastRead_${username}_${target}`;
        const currentTime = Date.now();

        localStorage.setItem(lastReadKey, currentTime.toString());

        setUnreadCounts(prev => ({ ...prev, [target]: 0 }));
    }, [username]);

    const openMediaModal = (content, type) => { setModalContent(content); setModalType(type); };
    const closeMediaModal = () => { setModalContent(null); setModalType(null); };

    const setActiveUserHandler = (user, type = 'individual') => {
        setActiveUser(user);
        setActiveChatType(type);

        markMessagesAsRead(user, type);

        if (isMobileView && setShowSidebar) {
            setShowSidebar(false);
        }
    };

    return { activeUser, setActiveUser, activeChatType, setActiveChatType, chat, setChat, uploading, setUploading, modalContent, modalType, isMobileView, showVoiceRecorder, setShowVoiceRecorder, showFileTypeModal, setShowFileTypeModal, unreadCounts, setUnreadCounts, blockedUsers, setBlockedUsers, clearedChats, setClearedChats, fileInputRef, openMediaModal, closeMediaModal, setActiveUserHandler, markMessagesAsRead };
}