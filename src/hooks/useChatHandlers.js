'use client';
import { useEffect, useRef, useCallback } from 'react';
import { ref, push, set, serverTimestamp, remove, onValue, off } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { db } from '@/lib/firebaseConfig';
import useChatStateAndListeners from './useChatStateAndListeners';

export default function useChatHandlers({ username, users, groups, setShowSidebar, callState, setCallState }) {
    const { activeUser, setActiveUser, activeChatType, setActiveChatType, chat, setChat, uploading, setUploading, modalContent, modalType, isMobileView, showVoiceRecorder, setShowVoiceRecorder, showFileTypeModal, setShowFileTypeModal, unreadCounts, setUnreadCounts, blockedUsers, setBlockedUsers, clearedChats, setClearedChats, fileInputRef, openMediaModal, closeMediaModal, setActiveUserHandler, markMessagesAsRead } = useChatStateAndListeners({ username, users, groups, setShowSidebar });

    const callRefRef = useRef(null);
    
    const sendCallInvitation = useCallback(async (toUser, type = 'audio') => {
        if (!username || !toUser) return;

        try {
            const callId = `${username}_${toUser}_${Date.now()}`;
            const callRef = ref(db, `calls/${toUser}`);

            await set(callRef, {
                from: username,
                to: toUser,
                type: type,
                status: 'ringing',
                callId: callId,
                timestamp: Date.now()
            });

            setCallState(prev => ({
                ...prev,
                callId: callId
            }));

            console.log(`${type} call invitation sent to:`, toUser, 'with ID:', callId);

        } catch (error) {
            console.error('Error sending call invitation:', error);
            toast.error('Failed to start call');
        }
    }, [username, setCallState]);

    useEffect(() => {
        if (callState.isOutgoingCall && callState.callWith && !callState.callId) {
            console.log('Sending call invitation to:', callState.callWith, 'type:', callState.callType);
            sendCallInvitation(callState.callWith, callState.callType);
        }
    }, [callState.isOutgoingCall, callState.callWith, callState.callType, callState.callId, sendCallInvitation]);

    useEffect(() => {
        if (!username) return;

        const callsRef = ref(db, `calls/${username}`);
        callRefRef.current = callsRef;

        const unsub = onValue(callsRef, (snapshot) => {
            if (snapshot.exists()) {
                const callData = snapshot.val();
                console.log('Call data received:', callData);

                if (callData.status === 'ringing' && callData.from !== username && !callState.isActiveCall && !callState.isOutgoingCall) {
                    console.log('Incoming call from:', callData.from);
                    setCallState({
                        isIncomingCall: true,
                        isOutgoingCall: false,
                        isActiveCall: false,
                        callWith: callData.from,
                        callType: callData.type || 'audio',
                        callId: callData.callId
                    });
                }

                if (callData.status === 'accepted' && callState.isOutgoingCall && callState.callWith === callData.to) {
                    console.log('Call accepted by:', callData.to);
                    setCallState(prev => ({
                        ...prev,
                        isIncomingCall: false,
                        isOutgoingCall: false,
                        isActiveCall: true
                    }));
                    toast.success('Call accepted!');
                }

                if (callData.status === 'rejected' && callState.isOutgoingCall && callState.callWith === callData.to) {
                    console.log('Call rejected by:', callData.to);
                    setCallState({
                        isIncomingCall: false,
                        isOutgoingCall: false,
                        isActiveCall: false,
                        callWith: null,
                        callType: 'audio',
                        callId: null
                    });
                    toast.error('Call rejected');

                    const currentUserCallRef = ref(db, `calls/${username}`);
                    remove(currentUserCallRef);
                }

                if (callData.status === 'ended' && (callState.isActiveCall || callState.isOutgoingCall || callState.isIncomingCall)) {
                    console.log('Call ended by remote user');
                    setCallState({
                        isIncomingCall: false,
                        isOutgoingCall: false,
                        isActiveCall: false,
                        callWith: null,
                        callType: 'audio',
                        callId: null
                    });

                    const currentUserCallRef = ref(db, `calls/${username}`);
                    remove(currentUserCallRef);
                }
            }
        }, (error) => {
            console.error('Error in call listener:', error);
        });

        return () => {
            if (callRefRef.current) {
                off(callRefRef.current);
            }
        };
    }, [username, callState, setCallState]);

    const sendCallResponse = useCallback(async (toUser, response, callId) => {
        if (!username || !toUser || !callId) return;

        try {
            const callRef = ref(db, `calls/${toUser}`);
            await set(callRef, {
                from: username,
                to: toUser,
                status: response,
                callId: callId,
                timestamp: Date.now()
            });
            console.log('Call response sent:', response, 'to:', toUser);
        } catch (error) {
            console.error('Error sending call response:', error);
            toast.error('Failed to send call response');
        }
    }, [username]);

    const endCallForBoth = useCallback(async (callWith, callId) => {
        if (!username || !callWith || !callId) return;

        try {
            const otherUserCallRef = ref(db, `calls/${callWith}`);
            await set(otherUserCallRef, {
                from: username,
                to: callWith,
                status: 'ended',
                callId: callId,
                endedBy: username,
                timestamp: Date.now()
            });

            const currentUserCallRef = ref(db, `calls/${username}`);
            await remove(currentUserCallRef);

            console.log('Call ended for both users');
        } catch (error) {
            console.error('Error ending call:', error);
        }
    }, [username]);

    const blockUser = async (userId) => {
        if (!username || !userId) {
            toast.error('Cannot block user');
            return;
        }

        try {
            const blockRef = ref(db, `blockedUsers/${username}/${userId}`);
            await set(blockRef, { blockedAt: serverTimestamp(), blockedBy: username });

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
            await set(newMessageRef, { username, message: url, type, fileName: fileName || '', format: format || '', duration: duration || '', timestamp: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        } catch (err) {
            console.error('sendFileMessage error:', err);
            toast.error('Failed to send file');
        }
    };

    const sendMessage = async (messageText, type = 'text', file = null, duration = 0) => {
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

            if (type === 'audio' && file) {
                setUploading(true);
                try {
                    toast.loading('Uploading voice message...', { id: 'voice-upload' });
                    const audioFile = new File([file], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
                    const data = await uploadToCloudinary(audioFile);

                    await set(newMessageRef, { username, message: data.secure_url, type: 'audio', fileName: 'Voice Message', format: 'webm', duration: duration, timestamp: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });

                    toast.success('Voice message sent!', { id: 'voice-upload' });
                } catch (error) {
                    console.error('Voice message upload error:', error);
                    toast.error('Failed to send voice message', { id: 'voice-upload' });
                    throw error;
                } finally {
                    setUploading(false);
                }
            } else {
                await set(newMessageRef, { username, message: messageText, type: 'text', timestamp: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
            }
        } catch (err) {
            console.error('sendMessage error:', err);
            if (type === 'audio') {
                toast.error('Failed to send voice message');
            } else {
                toast.error('Failed to send message');
            }
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

        try {
            await sendMessage('Voice message', 'audio', audioBlob, duration);
        } catch (error) {
            console.error('Voice message error:', error);
        }
    };

    const createGroupChat = async (groupName, selectedUsers) => {
        if (!groupName.trim() || selectedUsers.length === 0) {
            toast.error('Please enter a group name and select at least one user');
            return null;
        }

        try {
            const groupId = `${groupName.replace(/\s+/g, '_')}_${Date.now()}`;
            const groupRef = ref(db, `groupChats/${groupId}`);
            await set(groupRef, { groupName, createdBy: username, createdAt: new Date().toISOString(), members: [...selectedUsers, username], messages: {} });
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

    return { activeUser, setActiveUser, activeChatType, setActiveChatType, chat, uploading, fileInputRef, isMobileView, showVoiceRecorder, setShowVoiceRecorder, showFileTypeModal, setShowFileTypeModal, unreadCounts, modalContent, modalType, openMediaModal, closeMediaModal, handleFileInputChange, handleVoiceRecordComplete, createGroupChat, sendMessage, uploadToCloudinary, handlePaperClipClick, handleFileTypeSelect, setActiveUserHandler, markMessagesAsRead, blockUser, unblockUser, blockedUsers, clearChat, sendCallResponse, endCallForBoth, sendCallInvitation };
}