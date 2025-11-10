'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ref, onValue, push, set, serverTimestamp, off } from 'firebase/database';
import { db } from '@/lib/firebaseConfig';
import { toast } from 'react-hot-toast';

export default function useChatHandlers({ username, users, groups, setShowSidebar }) {
    const [state, setState] = useState({
        activeUser: '', activeChatType: 'individual', chat: [], uploading: false,
        modalContent: null, modalType: null, isMobileView: false, 
        showVoiceRecorder: false, showFileTypeModal: false, unreadCounts: {}
    });
    const fileInputRef = useRef(null);

    const setStateValue = (key, value) => setState(prev => ({ ...prev, [key]: value }));

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setStateValue('isMobileView', mobile);
            setShowSidebar?.(!mobile && !!state.activeUser);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [state.activeUser, setShowSidebar]);

    useEffect(() => {
        if (!state.activeUser || !username) return setStateValue('chat', []);
        
        const chatPath = state.activeChatType === 'individual' 
            ? `chats/${getChatId(username, state.activeUser)}`
            : `groupChats/${state.activeUser}/messages`;
            
        const unsub = onValue(ref(db, chatPath), (snapshot) => {
            const msgs = [];
            snapshot.forEach(child => msgs.push({ id: child.key, ...child.val() }));
            setStateValue('chat', msgs);
            markMessagesAsRead(state.activeUser, state.activeChatType);
        }, console.error);

        return () => { console.log('Cleaning up chat listener'); unsub(); };
    }, [state.activeUser, username, state.activeChatType]);

    useEffect(() => {
        if (!username) return;
        
        const initialUnreadCounts = {};
        [...(users || []), ...(groups || [])].forEach(item => {
            const id = typeof item === 'string' ? item : item?.id;
            if (id && id !== username) initialUnreadCounts[id] = 0;
        });
        setStateValue('unreadCounts', initialUnreadCounts);

        const unsubscribeFunctions = [
            ...setupUserListeners(users, username, setStateValue),
            ...setupGroupListeners(groups, username, setStateValue)
        ];

        return () => unsubscribeFunctions.forEach(unsub => unsub?.());
    }, [users, groups, username]);

    const markMessagesAsRead = useCallback((target, type = 'individual') => {
        if (!username || !target) return;
        const lastReadKey = `lastRead_${username}_${target}`;
        localStorage.setItem(lastReadKey, Date.now().toString());
        setStateValue('unreadCounts', prev => ({ ...prev, [target]: 0 }));
    }, [username]);

    const sendMessage = async (messageData, isFile = false) => {
        if (!state.activeUser || !username) return;
        
        const chatPath = state.activeChatType === 'individual'
            ? `chats/${getChatId(username, state.activeUser)}`
            : `groupChats/${state.activeUser}/messages`;
            
        try {
            const newMessageRef = push(ref(db, chatPath));
            await set(newMessageRef, {
                username,
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                ...messageData
            });
            console.log(`${isFile ? 'File' : 'Text'} message sent successfully`);
        } catch (err) {
            console.error('sendMessage error:', err);
            toast.error(`Failed to send ${isFile ? 'file' : 'message'}`);
        }
    };

    const sendFileMessage = async (fileData) => 
        await sendMessage({ ...fileData, type: fileData.type || 'file' }, true);

    const uploadToCloudinary = useCallback(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'chat_app_upload');
        
        const resourceType = file.type.startsWith('image/') ? 'image' : 
                           file.type.startsWith('video/') || file.type.startsWith('audio/') ? 'video' : 'raw';
        
        const response = await fetch(`https://api.cloudinary.com/v1_1/dh72bjbwy/${resourceType}/upload`, 
            { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Upload failed');
        return response.json();
    }, []);

    const handleFileUpload = async (file) => {
        if (!file || !state.activeUser) {
            toast.error(!state.activeUser ? 'Select a user to send file' : 'No file selected');
            return;
        }

        setStateValue('uploading', true);
        try {
            const kind = file.type.split('/')[0];
            toast.loading(`Uploading ${kind}...`, { id: 'upload' });

            const data = await uploadToCloudinary(file);
            const msgType = getMessageType(file.type, data.resource_type);
            
            await sendFileMessage({
                url: data.secure_url,
                type: msgType,
                fileName: file.name || data.original_filename || '',
                format: data.format || '',
                duration: data.duration ? Math.round(data.duration) : undefined
            });
            
            toast.success(`${kind.charAt(0).toUpperCase() + kind.slice(1)} sent!`, { id: 'upload' });
        } catch (error) {
            console.error('File upload error:', error);
            toast.error('Failed to upload file', { id: 'upload' });
        } finally {
            setStateValue('uploading', false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleVoiceRecordComplete = async (audioBlob, duration) => {
        if (!state.activeUser) return toast.error('Select a user to send voice message');
        
        setStateValue('uploading', true);
        try {
            toast.loading('Uploading voice message...', { id: 'voice-upload' });
            const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
            const data = await uploadToCloudinary(audioFile);
            await sendFileMessage({ 
                url: data.secure_url, 
                type: 'audio', 
                fileName: 'Voice Message', 
                format: 'webm', 
                duration 
            });
            toast.success('Voice message sent!', { id: 'voice-upload' });
            setStateValue('showVoiceRecorder', false);
        } catch (error) {
            console.error('Voice message upload error:', error);
            toast.error('Failed to send voice message', { id: 'voice-upload' });
        } finally {
            setStateValue('uploading', false);
        }
    };

    const createGroupChat = async (groupName, selectedUsers) => {
        if (!groupName.trim() || selectedUsers.length === 0) {
            toast.error('Please enter a group name and select at least one user');
            return null;
        }

        try {
            const groupId = `${groupName.replace(/\s+/g, '_')}_${Date.now()}`;
            await set(ref(db, `groupChats/${groupId}`), {
                groupName, createdBy: username, createdAt: new Date().toISOString(),
                members: [...selectedUsers, username], messages: {}
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
        if (!state.activeUser) return toast.error('Please select a user to chat with');
        setStateValue('showFileTypeModal', true);
    };

    const handleFileTypeSelect = (fileType) => {
        setStateValue('showFileTypeModal', false);
        if (!fileInputRef.current) return;

        const acceptTypes = {
            image: 'image/*',
            video: 'video/*',
            document: '.pdf,.doc,.docx,.txt,.zip,.rar,.7z,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        fileInputRef.current.accept = acceptTypes[fileType] || '*/*';
        fileInputRef.current?.click();
        
        setTimeout(() => {
            if (fileInputRef.current) fileInputRef.current.accept = 'image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.zip,.txt';
        }, 1000);
    };

    const setActiveUserHandler = (user, type = 'individual') => {
        setStateValue('activeUser', user);
        setStateValue('activeChatType', type);
        markMessagesAsRead(user, type);
        if (state.isMobileView) setShowSidebar?.(false);
    };

    // Helper functions
    const getChatId = (user1, user2) => user1 < user2 ? `${user1}_${user2}` : `${user2}_${user1}`;
    
    const getMessageType = (fileType, resourceType) => {
        if (resourceType === 'image' || fileType.startsWith('image/')) return 'image';
        if (fileType.startsWith('audio/')) return 'audio';
        if (resourceType === 'video' || fileType.startsWith('video/')) return 'video';
        return 'file';
    };

    const setupUserListeners = (users, username, setStateValue) => 
        (users || []).filter(user => user !== username).map(user => 
            onValue(ref(db, `chats/${getChatId(username, user)}`), (snapshot) => {
                const messages = getSortedMessages(snapshot);
                const lastRead = Number(localStorage.getItem(`lastRead_${username}_${user}`) || 0);
                const unread = messages.filter(msg => (msg.timestamp || 0) > lastRead && msg.username !== username).length;
                setStateValue('unreadCounts', prev => ({ ...prev, [user]: unread }));
            }, console.error)
        );

    const setupGroupListeners = (groups, username, setStateValue) => 
        (groups || []).map(group => {
            const groupId = typeof group === 'string' ? group : group?.id;
            if (!groupId) return null;
            
            return onValue(ref(db, `groupChats/${groupId}/messages`), (snapshot) => {
                const messages = getSortedMessages(snapshot);
                const lastRead = Number(localStorage.getItem(`lastRead_${username}_${groupId}`) || 0);
                const unread = messages.filter(msg => (msg.timestamp || 0) > lastRead && msg.username !== username).length;
                setStateValue('unreadCounts', prev => ({ ...prev, [groupId]: unread }));
            }, console.error);
        }).filter(Boolean);

    const getSortedMessages = (snapshot) => {
        if (!snapshot.exists()) return [];
        const messages = [];
        snapshot.forEach(child => messages.push({ id: child.key, ...child.val(), timestamp: child.val().timestamp ?? 0 }));
        return messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    };

    return {
        ...state,
        setStateValue,
        fileInputRef,
        markMessagesAsRead,
        handleFileInputChange: (e) => handleFileUpload(e.target.files?.[0]),
        handleVoiceRecordComplete,
        createGroupChat,
        sendMessage: (text) => sendMessage({ message: text, type: 'text' }),
        uploadToCloudinary,
        handlePaperClipClick,
        handleFileTypeSelect,
        setActiveUserHandler,
        openMediaModal: (content, type) => { setStateValue('modalContent', content); setStateValue('modalType', type); },
        closeMediaModal: () => { setStateValue('modalContent', null); setStateValue('modalType', null); }
    };
}