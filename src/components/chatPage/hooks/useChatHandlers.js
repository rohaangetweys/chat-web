'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ref, onValue, push, set, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebaseConfig';
import { toast } from 'react-hot-toast';

export default function useChatHandlers({ username, users, groups, setShowSidebar }) {
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

    const fileInputRef = useRef(null);

    useEffect(() => {
        const checkMobile = () => { 
            const mobile = window.innerWidth <= 768; 
            setIsMobileView(mobile); 
            if (mobile && activeUser) {
                // Use the external setShowSidebar function if provided, otherwise use local state
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
        if (!activeUser || !username) { 
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
            const msgs = []; 
            snapshot.forEach((child) => {
                const msgData = child.val();
                msgs.push({ 
                    id: child.key, 
                    ...msgData 
                });
            }); 
            
            console.log('Received messages:', msgs.length);
            setChat(msgs); 
            markMessagesAsRead(activeUser, activeChatType); 
        }, (error) => {
            console.error('Error in chat listener:', error);
        });
        
        return () => {
            console.log('Cleaning up chat listener for:', activeUser);
            unsub();
        };
    }, [activeUser, username, activeChatType]);

    useEffect(() => {
        if (!username) return;
        
        console.log('Setting up unread counts listeners for users:', users.length, 'groups:', groups.length);
        
        const unsubscribeFunctions = [];
        const newUnreadCounts = {};

        users.forEach((user) => {
            if (user === username) return;
            
            const chatId = username < user ? `${username}_${user}` : `${user}_${username}`;
            const chatRef = ref(db, `chats/${chatId}`);
            
            const unsubscribe = onValue(chatRef, (snapshot) => {
                if (!snapshot.exists()) { 
                    newUnreadCounts[user] = 0; 
                    setUnreadCounts(prev => ({ ...prev, [user]: 0 })); 
                    return; 
                }
                
                const messages = []; 
                snapshot.forEach((child) => messages.push({ id: child.key, ...child.val() }));
                
                const lastReadKey = `lastRead_${username}_${user}`;
                const lastRead = parseInt(localStorage.getItem(lastReadKey)) || 0;
                const unread = messages.filter(msg => msg.timestamp > lastRead && msg.username !== username).length;
                
                newUnreadCounts[user] = unread; 
                setUnreadCounts(prev => ({ ...prev, [user]: unread }));
            });
            
            unsubscribeFunctions.push(unsubscribe);
        });

        groups.forEach((group) => {
            const messagesRef = ref(db, `groupChats/${group.id}/messages`);
            
            const unsubscribe = onValue(messagesRef, (snapshot) => {
                if (!snapshot.exists()) { 
                    newUnreadCounts[group.id] = 0; 
                    setUnreadCounts(prev => ({ ...prev, [group.id]: 0 })); 
                    return; 
                }
                
                const messages = []; 
                snapshot.forEach((child) => messages.push({ id: child.key, ...child.val() }));
                
                const lastReadKey = `lastRead_${username}_${group.id}`; 
                const lastRead = parseInt(localStorage.getItem(lastReadKey)) || 0;
                const unread = messages.filter(msg => msg.timestamp > lastRead && msg.username !== username).length;
                
                newUnreadCounts[group.id] = unread; 
                setUnreadCounts(prev => ({ ...prev, [group.id]: unread }));
            });
            
            unsubscribeFunctions.push(unsubscribe);
        });

        setUnreadCounts(newUnreadCounts);
        
        return () => {
            console.log('Cleaning up unread count listeners');
            unsubscribeFunctions.forEach(unsub => unsub());
        };
    }, [users, groups, username]);

    const markMessagesAsRead = (target, type = 'individual') => { 
        if (!username) return; 
        const lastReadKey = `lastRead_${username}_${target}`; 
        localStorage.setItem(lastReadKey, Date.now().toString()); 
        setUnreadCounts(prev => ({ ...prev, [target]: 0 })); 
    };

    const sendFileMessage = async ({ url, type, fileName, format, duration }) => {
        if (!activeUser || !username) return;
        
        let chatRef;
        if (activeChatType === 'individual') { 
            const chatId = username < activeUser ? `${username}_${activeUser}` : `${activeUser}_${username}`; 
            chatRef = ref(db, `chats/${chatId}`); 
        } else { 
            chatRef = ref(db, `groupChats/${activeUser}/messages`); 
        }
        
        try { 
            await push(chatRef, { 
                username, 
                message: url, 
                type, 
                fileName: fileName || '', 
                format: format || '', 
                duration: duration || '', 
                timestamp: Date.now(), 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            }); 
            console.log('File message sent successfully');
        } catch (err) { 
            console.error('sendFileMessage error:', err); 
            toast.error('Failed to send file'); 
        }
    };

    const sendMessage = async (messageText) => {
        if (!activeUser || !username) return;
        
        let chatRef;
        if (activeChatType === 'individual') { 
            const chatId = username < activeUser ? `${username}_${activeUser}` : `${activeUser}_${username}`; 
            chatRef = ref(db, `chats/${chatId}`); 
        } else { 
            chatRef = ref(db, `groupChats/${activeUser}/messages`); 
        }
        
        try { 
            await push(chatRef, { 
                username, 
                message: messageText, 
                type: 'text', 
                timestamp: Date.now(), 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            }); 
            console.log('Text message sent successfully');
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
            const groupId = `${groupName}_${Date.now()}`; 
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
    };
}