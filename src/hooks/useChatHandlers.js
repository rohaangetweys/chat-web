'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ref, onValue, push, set, serverTimestamp, off, remove, update, get } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { db } from '@/lib/firebaseConfig';

export default function useChatHandlers({ username, users, groups, setShowSidebar, callState, setCallState }) {
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

    // Listen for incoming calls
    useEffect(() => {
        if (!username) return;

        const callsRef = ref(db, `calls/${username}`);
        const unsub = onValue(callsRef, (snapshot) => {
            if (snapshot.exists()) {
                const callData = snapshot.val();
                if (callData.status === 'ringing' && !callState.isActiveCall && !callState.isOutgoingCall) {
                    setCallState({
                        isIncomingCall: true,
                        isOutgoingCall: false,
                        isActiveCall: false,
                        callWith: callData.from,
                        callType: callData.type || 'audio'
                    });
                }
            }
        });

        return () => unsub();
    }, [username, callState.isActiveCall, callState.isOutgoingCall, setCallState]);

    // Send call invitation
    const sendCallInvitation = useCallback(async (toUser, type = 'audio') => {
        if (!username || !toUser) return;

        try {
            const callId = `${username}_${toUser}_${Date.now()}`;
            const callRef = ref(db, `calls/${toUser}`);
            
            await set(callRef, {
                from: username,
                type: type,
                status: 'ringing',
                callId: callId,
                timestamp: Date.now()
            });

            // Set timeout to auto-reject if not answered
            setTimeout(async () => {
                const currentCallRef = ref(db, `calls/${toUser}`);
                const snapshot = await get(currentCallRef);
                if (snapshot.exists() && snapshot.val().status === 'ringing') {
                    await remove(currentCallRef);
                    if (callState.isOutgoingCall) {
                        setCallState(prev => ({ ...prev, isOutgoingCall: false }));
                        toast.error('Call not answered');
                    }
                }
            }, 30000); // 30 seconds timeout

        } catch (error) {
            console.error('Error sending call invitation:', error);
            toast.error('Failed to start call');
        }
    }, [username, callState.isOutgoingCall, setCallState]);

    // Update call state when outgoing call starts
    useEffect(() => {
        if (callState.isOutgoingCall && callState.callWith) {
            sendCallInvitation(callState.callWith, callState.callType);
        }
    }, [callState.isOutgoingCall, callState.callWith, callState.callType, sendCallInvitation]);

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

        console.log('Setting up chat listener for:', activeUser, 'Type:', activeChatType);

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
                    msgs.push({
                        id: child.key,
                        ...msgData
                    });
                }
            });

            msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            console.log('Received messages after filtering:', msgs.length);
            setChat(msgs);

            markMessagesAsRead(activeUser, activeChatType);
        }, (error) => {
            console.error('Error in chat listener:', error);
        });

        return () => {
            console.log('Cleaning up chat listener for:', activeUser);
            unsub();
        };
    }, [activeUser, username, activeChatType, blockedUsers, clearedChats]);

    useEffect(() => {
        if (!username) return;

        console.log('Setting up unread counts listeners for users:', users?.length, 'groups:', groups?.length);

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
                        messages.push({
                            id: child.key,
                            ...msgData,
                            timestamp: msgData.timestamp ?? 0
                        });
                    }
                });

                messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

                const lastReadKey = `lastRead_${username}_${user}`;
                const lastRead = Number(localStorage.getItem(lastReadKey) || 0);

                const unread = messages.filter(msg =>
                    (msg.timestamp || 0) > lastRead &&
                    msg.username !== username
                ).length;

                console.log(`Unread for ${user}:`, unread, 'lastRead:', lastRead);
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
                        messages.push({
                            id: child.key,
                            ...msgData,
                            timestamp: msgData.timestamp ?? 0
                        });
                    }
                });

                messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

                const lastReadKey = `lastRead_${username}_${groupId}`;
                const lastRead = Number(localStorage.getItem(lastReadKey) || 0);

                console.log(`Group ${groupId}: lastRead = ${lastRead}, messages count = ${messages.length}`);

                const unread = messages.filter(msg => {
                    const isUnread = (msg.timestamp || 0) > lastRead;
                    const isFromOthers = msg.username !== username;
                    console.log(`Message ${msg.id}: ts=${msg.timestamp}, from=${msg.username}, isUnread=${isUnread}, isFromOthers=${isFromOthers}`);
                    return isUnread && isFromOthers;
                }).length;

                console.log(`Unread for group ${groupId}:`, unread, 'lastRead:', lastRead);
                setUnreadCounts(prev => ({ ...prev, [groupId]: unread }));
            }, (error) => {
                console.error(`Error listening to group ${groupId}:`, error);
            });

            unsubscribeFunctions.push(unsubscribe);
        });

        return () => {
            console.log('Cleaning up unread count listeners');
            unsubscribeFunctions.forEach(unsub => unsub && unsub());
        };
    }, [users, groups, username, blockedUsers, clearedChats]);

    const blockUser = async (userId) => {
        if (!username || !userId) {
            toast.error('Cannot block user');
            return;
        }

        try {
            const blockRef = ref(db, `blockedUsers/${username}/${userId}`);
            await set(blockRef, {
                blockedAt: serverTimestamp(),
                blockedBy: username
            });

            toast.success(`User ${userId} blocked successfully`);

            if (activeUser === userId) {
                setActiveUser('');
                setChat([]);
            }
        } catch (error) {
            console.error('Error blocking user:', error);
            toast.error('Failed to block user');
        }
    };

    const unblockUser = async (userId) => {
        if (!username || !userId) {
            toast.error('Cannot unblock user');
            return;
        }

        try {
            const blockRef = ref(db, `blockedUsers/${username}/${userId}`);
            await remove(blockRef);
            toast.success(`User ${userId} unblocked successfully`);
        } catch (error) {
            console.error('Error unblocking user:', error);
            toast.error('Failed to unblock user');
        }
    };

    const clearChat = async (target, type = 'individual') => {
        if (!username || !target) {
            toast.error('Cannot clear chat');
            return;
        }

        try {
            const clearKey = type === 'individual' ? target : `group_${target}`;
            const clearRef = ref(db, `clearedChats/${username}/${clearKey}`);
            
            await set(clearRef, Date.now());
            
            toast.success('Chat cleared successfully');
            
            if (activeUser === target && activeChatType === type) {
                setChat([]);
            }
        } catch (error) {
            console.error('Error clearing chat:', error);
            toast.error('Failed to clear chat');
        }
    };

    const markMessagesAsRead = useCallback((target, type = 'individual') => {
        if (!username || !target) return;

        const lastReadKey = `lastRead_${username}_${target}`;
        const currentTime = Date.now();

        console.log(`Marking messages as read for ${target} (${type}), setting lastRead to:`, currentTime);
        localStorage.setItem(lastReadKey, currentTime.toString());

        setUnreadCounts(prev => ({
            ...prev,
            [target]: 0
        }));
    }, [username]);

    const sendFileMessage = async ({ url, type, fileName, format, duration }) => {
        if (!activeUser || !username) return;

        if (activeChatType === 'individual' && blockedUsers.includes(activeUser)) {
            toast.error('Cannot send message to blocked user');
            return;
        }

        let chatRef;
        if (activeChatType === 'individual') {
            const chatId = username < activeUser ? `${username}_${activeUser}` : `${activeUser}_${username}`;
            chatRef = ref(db, `chats/${chatId}`);
        } else {
            chatRef = ref(db, `groupChats/${activeUser}/messages`);
        }

        try {
            const newMessageRef = push(chatRef);
            await set(newMessageRef, {
                username,
                message: url,
                type,
                fileName: fileName || '',
                format: format || '',
                duration: duration || '',
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            console.log('File message sent successfully to:', activeUser, 'Type:', activeChatType);
        } catch (err) {
            console.error('sendFileMessage error:', err);
            toast.error('Failed to send file');
        }
    };

    const sendMessage = async (messageText) => {
        if (!activeUser || !username) return;

        if (activeChatType === 'individual' && blockedUsers.includes(activeUser)) {
            toast.error('Cannot send message to blocked user');
            return;
        }

        let chatRef;
        if (activeChatType === 'individual') {
            const chatId = username < activeUser ? `${username}_${activeUser}` : `${activeUser}_${username}`;
            chatRef = ref(db, `chats/${chatId}`);
        } else {
            chatRef = ref(db, `groupChats/${activeUser}/messages`);
        }

        try {
            const newMessageRef = push(chatRef);
            await set(newMessageRef, {
                username,
                message: messageText,
                type: 'text',
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            console.log('Text message sent successfully to:', activeUser, 'Type:', activeChatType);
        } catch (err) {
            console.error('sendMessage error:', err);
            toast.error('Failed to send message');
        }
    };

    const uploadToCloudinary = useCallback(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'chat_app_upload');

        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const isAudio = file.type.startsWith('audio/');
        const resourceType = isImage ? 'image' : isVideo ? 'video' : isAudio ? 'video' : 'raw';

        const response = await fetch(`https://api.cloudinary.com/v1_1/dh72bjbwy/${resourceType}/upload`, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return data;
    }, []);

    const handleFileUpload = async (file) => {
        if (!file) return;
        if (!activeUser) {
            toast.error('Select a user to send file');
            return;
        }

        if (activeChatType === 'individual' && blockedUsers.includes(activeUser)) {
            toast.error('Cannot send file to blocked user');
            return;
        }

        setUploading(true);
        try {
            const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'file';
            toast.loading(`Uploading ${kind}...`, { id: 'upload' });

            const data = await uploadToCloudinary(file);
            const url = data.secure_url;
            const fileName = file.name || data.original_filename || '';
            const format = data.format || '';

            let msgType = 'file';
            if (data.resource_type === 'image' || file.type.startsWith('image/'))
                msgType = 'image';
            else if (data.resource_type === 'video' || file.type.startsWith('video/') || file.type.startsWith('audio/'))
                msgType = file.type.startsWith('audio/') ? 'audio' : 'video';

            await sendFileMessage({ url, type: msgType, fileName, format, duration: data.duration ? Math.round(data.duration) : undefined });
            toast.success(`${kind.charAt(0).toUpperCase() + kind.slice(1)} sent!`, { id: 'upload' });
        } catch (error) {
            console.error('File upload error:', error);
            toast.error('Failed to upload file', { id: 'upload' });
        }
        finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileInputChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await handleFileUpload(file);
    };

    const handleVoiceRecordComplete = async (audioBlob, duration) => {
        if (!activeUser) {
            toast.error('Select a user to send voice message');
            return;
        }

        if (activeChatType === 'individual' && blockedUsers.includes(activeUser)) {
            toast.error('Cannot send voice message to blocked user');
            return;
        }

        setUploading(true);
        try {
            toast.loading('Uploading voice message...', { id: 'voice-upload' });
            const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
            const data = await uploadToCloudinary(audioFile);
            await sendFileMessage({ url: data.secure_url, type: 'audio', fileName: 'Voice Message', format: 'webm', duration });
            toast.success('Voice message sent!', { id: 'voice-upload' });
            setShowVoiceRecorder(false);
        } catch (error) {
            console.error('Voice message upload error:', error);
            toast.error('Failed to send voice message', { id: 'voice-upload' });
        } finally {
            setUploading(false);
        }
    };

    const openMediaModal = (content, type) => { setModalContent(content); setModalType(type); };
    const closeMediaModal = () => { setModalContent(null); setModalType(null); };

    const createGroupChat = async (groupName, selectedUsers) => {
        if (!groupName.trim() || selectedUsers.length === 0) {
            toast.error('Please enter a group name and select at least one user');
            return null;
        }

        try {
            const groupId = `${groupName.replace(/\s+/g, '_')}_${Date.now()}`;
            const groupRef = ref(db, `groupChats/${groupId}`);
            await set(groupRef, {
                groupName,
                createdBy: username,
                createdAt: new Date().toISOString(),
                members: [...selectedUsers, username],
                messages: {}
            });
            toast.success(`Group "${groupName}" created successfully!`);
            return groupId;
        } catch (error) {
            console.error('Error creating group:', error);
            toast.error('Failed to create group');
            return null;
        }
    };

    const handlePaperClipClick = () => {
        if (!activeUser) {
            toast.error('Please select a user to chat with');
            return;
        }

        if (activeChatType === 'individual' && blockedUsers.includes(activeUser)) {
            toast.error('Cannot send files to blocked user');
            return;
        }

        setShowFileTypeModal(true);
    };

    const handleFileTypeSelect = (fileType) => {
        setShowFileTypeModal(false);
        if (!fileInputRef.current) return;

        switch (fileType) {
            case 'image': fileInputRef.current.accept = 'image/*'; break;
            case 'video': fileInputRef.current.accept = 'video/*'; break;
            case 'document': fileInputRef.current.accept = '.pdf,.doc,.docx,.txt,.zip,.rar,.7z,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
            default: fileInputRef.current.accept = '*/*';
        }

        fileInputRef.current?.click();
        setTimeout(() => {
            if (fileInputRef.current)
                fileInputRef.current.accept = 'image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.zip,.txt';
        }, 1000);
    };

    const setActiveUserHandler = (user, type = 'individual') => {
        setActiveUser(user);
        setActiveChatType(type);

        markMessagesAsRead(user, type);

        if (isMobileView && setShowSidebar) {
            setShowSidebar(false);
        }
    };

    return {
        activeUser,
        setActiveUser,
        activeChatType,
        setActiveChatType,
        chat,
        uploading,
        fileInputRef,
        isMobileView,
        showVoiceRecorder,
        setShowVoiceRecorder,
        showFileTypeModal,
        setShowFileTypeModal,
        unreadCounts,
        modalContent,
        modalType,
        openMediaModal,
        closeMediaModal,
        handleFileInputChange,
        handleVoiceRecordComplete,
        createGroupChat,
        sendMessage,
        uploadToCloudinary,
        handlePaperClipClick,
        handleFileTypeSelect,
        setActiveUserHandler,
        markMessagesAsRead,
        blockUser,
        unblockUser,
        blockedUsers,
        clearChat,
    };
}