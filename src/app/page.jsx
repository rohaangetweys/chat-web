'use client';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, push, set } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { Toaster, toast } from "react-hot-toast";
import { FaPhone, FaVideo, FaEllipsisV, FaArrowLeft } from "react-icons/fa";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import MediaModal from "@/components/MediaModal";
import VoiceRecorder from "@/components/VoiceRecorder";
import FileTypeModal from "@/components/FileTypeModal";

export default function ChatUI() {
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [authChecking, setAuthChecking] = useState(true);

    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [activeUser, setActiveUser] = useState("");
    const [activeChatType, setActiveChatType] = useState("individual");
    const [chat, setChat] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [isMobileView, setIsMobileView] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [showFileTypeModal, setShowFileTypeModal] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobileView(mobile);
            if (mobile && activeUser) {
                setShowSidebar(false);
            } else {
                setShowSidebar(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, [activeUser]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setAuthChecking(false);
            } else {
                setUser(null);
                setAuthChecking(false);
                router.push("/login");
            }
        });

        return () => {
            unsubscribe && unsubscribe();
        };
    }, [router]);

    const username = user?.displayName
        ? user.displayName
        : user?.email
            ? user.email.split("@")[0]
            : "";

    useEffect(() => {
        if (!username) return;
        const userRef = ref(db, `users/${username}`);
        set(userRef, true).catch((err) => {
            console.error("failed to add user to users/:", err);
        });
    }, [username]);

    useEffect(() => {
        const usersRef = ref(db, "users/");
        const unsub = onValue(usersRef, (snapshot) => {
            const list = [];
            snapshot.forEach((child) => {
                if (child.key) list.push(child.key);
            });
            setUsers(list);
        });

        return () => unsub();
    }, []);

    useEffect(() => {
        if (!username) return;

        const groupsRef = ref(db, "groupChats/");
        const unsub = onValue(groupsRef, (snapshot) => {
            const groupsList = [];
            snapshot.forEach((child) => {
                const groupData = child.val();
                if (groupData.members && groupData.members.includes(username)) {
                    groupsList.push({
                        id: child.key,
                        name: groupData.groupName,
                        createdBy: groupData.createdBy,
                        members: groupData.members
                    });
                }
            });
            setGroups(groupsList);
        });

        return () => unsub();
    }, [username]);

    useEffect(() => {
        if (!activeUser || !username) {
            setChat([]);
            return;
        }

        let chatRef;
        if (activeChatType === "individual") {
            const chatId =
                username < activeUser
                    ? `${username}_${activeUser}`
                    : `${activeUser}_${username}`;
            chatRef = ref(db, `chats/${chatId}`);
        } else {
            chatRef = ref(db, `groupChats/${activeUser}/messages`);
        }

        const unsub = onValue(chatRef, (snapshot) => {
            const msgs = [];
            snapshot.forEach((child) => {
                msgs.push({
                    id: child.key,
                    ...child.val()
                });
            });
            setChat(msgs);
        });

        return () => unsub();
    }, [activeUser, username, activeChatType]);

    const sendFileMessage = async ({ url, type, fileName, format, duration }) => {
        if (!activeUser || !username) return;

        let chatRef;
        if (activeChatType === "individual") {
            const chatId =
                username < activeUser
                    ? `${username}_${activeUser}`
                    : `${activeUser}_${username}`;
            chatRef = ref(db, `chats/${chatId}`);
        } else {
            chatRef = ref(db, `groupChats/${activeUser}/messages`);
        }

        try {
            await push(chatRef, {
                username,
                message: url,
                type: type,
                fileName: fileName || '',
                format: format || '',
                duration: duration || '',
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            });
        } catch (err) {
            console.error("sendFileMessage error:", err);
            toast.error("Failed to send file");
        }
    };

    const sendMessage = async (messageText) => {
        if (!activeUser || !username) return;

        let chatRef;
        if (activeChatType === "individual") {
            const chatId =
                username < activeUser
                    ? `${username}_${activeUser}`
                    : `${activeUser}_${username}`;
            chatRef = ref(db, `chats/${chatId}`);
        } else {
            chatRef = ref(db, `groupChats/${activeUser}/messages`);
        }

        try {
            await push(chatRef, {
                username,
                message: messageText,
                type: "text",
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            });
        } catch (err) {
            console.error("sendMessage error:", err);
            toast.error("Failed to send message");
        }
    };

    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'chat_app_upload');

        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const isAudio = file.type.startsWith('audio/');
        const resourceType = isImage ? 'image' : isVideo ? 'video' : isAudio ? 'video' : 'raw';

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/dh72bjbwy/${resourceType}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    };

    const handleFileUpload = async (file, fileType = null) => {
        if (!file) return;

        // File size validations
        if (file.type.startsWith('audio/') && file.size > 10 * 1024 * 1024) {
            toast.error('Audio size should be less than 10MB');
            return;
        }
        if (file.type.startsWith('image/') && file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }
        if (file.type.startsWith('video/') && file.size > 150 * 1024 * 1024) {
            toast.error('Video size should be less than 150MB');
            return;
        }
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/') && file.size > 50 * 1024 * 1024) {
            toast.error('File size should be less than 50MB');
            return;
        }

        if (!activeUser) {
            toast.error('Select a user to send file');
            return;
        }

        setUploading(true);
        try {
            const kind = file.type.startsWith('image/') ? 'image' :
                file.type.startsWith('video/') ? 'video' :
                    file.type.startsWith('audio/') ? 'audio' : 'file';

            toast.loading(`Uploading ${kind}...`, { id: 'upload' });

            const data = await uploadToCloudinary(file);

            let url = data.secure_url;
            const fileName = file.name || data.original_filename || '';
            const format = data.format || '';

            let msgType = 'file';
            if (data.resource_type === 'image' || file.type.startsWith('image/')) {
                msgType = 'image';
            } else if (data.resource_type === 'video' || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
                msgType = file.type.startsWith('audio/') ? 'audio' : 'video';
            }

            await sendFileMessage({
                url,
                type: msgType,
                fileName,
                format,
                duration: data.duration ? Math.round(data.duration) : undefined
            });

            toast.success(`${kind.charAt(0).toUpperCase() + kind.slice(1)} sent!`, { id: 'upload' });
        } catch (error) {
            console.error('File upload error:', error);
            toast.error('Failed to upload file', { id: 'upload' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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

            const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, {
                type: 'audio/webm'
            });

            const data = await uploadToCloudinary(audioFile);

            await sendFileMessage({
                url: data.secure_url,
                type: 'audio',
                fileName: 'Voice Message',
                format: 'webm',
                duration: duration
            });

            toast.success('Voice message sent!', { id: 'voice-upload' });
            setShowVoiceRecorder(false);
        } catch (error) {
            console.error('Voice message upload error:', error);
            toast.error('Failed to send voice message', { id: 'voice-upload' });
        } finally {
            setUploading(false);
        }
    };

    const openMediaModal = (content, type) => {
        setModalContent(content);
        setModalType(type);
    };

    const closeMediaModal = () => {
        setModalContent(null);
        setModalType(null);
    };

    const createGroupChat = async (groupName, selectedUsers) => {
        if (!groupName.trim() || selectedUsers.length === 0) {
            toast.error('Please enter a group name and select at least one user');
            return;
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

    const handleUserSelect = (user, type = 'individual') => {
        setActiveUser(user);
        setActiveChatType(type);
        if (isMobileView) {
            setShowSidebar(false);
        }
    };

    const handleBackToSidebar = () => {
        setShowSidebar(true);
        setActiveUser("");
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

        switch (fileType) {
            case 'image':
                fileInputRef.current.accept = 'image/*';
                break;
            case 'video':
                fileInputRef.current.accept = 'video/*';
                break;
            case 'document':
                fileInputRef.current.accept = '.pdf,.doc,.docx,.txt,.zip,.rar,.7z,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
            default:
                fileInputRef.current.accept = '*/*';
        }

        fileInputRef.current?.click();

        // Reset accept attribute after click
        setTimeout(() => {
            if (fileInputRef.current) {
                fileInputRef.current.accept = 'image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.zip,.txt';
            }
        }, 1000);
    };

    if (authChecking) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#111b21]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-300">Checking authentication...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex h-screen bg-[#111b21] text-white overflow-hidden">
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    style: {
                        background: '#2a3942',
                        color: 'white',
                        border: '1px solid #374248',
                    },
                }}
            />

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.zip,.txt"
                className="hidden"
                disabled={uploading || !activeUser}
            />

            {/* Sidebar - Conditionally rendered based on mobile view */}
            <div className={`${isMobileView ? (showSidebar ? 'flex' : 'hidden') : 'flex'} ${isMobileView ? 'w-full' : 'w-1/4'}`}>
                <Sidebar
                    activeUser={activeUser}
                    setActiveUser={handleUserSelect}
                    setUsers={setUsers}
                    username={username}
                    users={users}
                    groups={groups}
                    activeChatType={activeChatType}
                    setActiveChatType={setActiveChatType}
                    onCreateGroup={createGroupChat}
                />
            </div>

            {/* Chat Area - Conditionally rendered based on mobile view */}
            <div className={`${isMobileView ? (showSidebar ? 'hidden' : 'flex') : 'flex'} flex-1 flex-col bg-[#0b141a]`}>
                {/* Chat Header with Back Button for Mobile */}
                {activeUser ? (
                    <div className="flex items-center justify-between p-3 bg-[#202c33] border-b border-[#374248]">
                        <div className="flex items-center gap-3">
                            {isMobileView && (
                                <button
                                    onClick={handleBackToSidebar}
                                    className="p-2 text-gray-300 hover:text-white transition-colors"
                                >
                                    <FaArrowLeft size={18} />
                                </button>
                            )}
                            <div className="relative">
                                <div className={`w-10 h-10 rounded-full flex justify-center items-center text-white font-semibold ${activeChatType === 'group' ? 'bg-purple-600' : 'bg-[#00a884]'
                                    }`}>
                                    {activeChatType === 'group' ? '👥' : activeUser.slice(0, 1).toUpperCase()}
                                </div>
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00a884] rounded-full border-2 border-[#202c33]"></div>
                            </div>
                            <div>
                                <h2 className="font-semibold text-white">
                                    {activeChatType === 'group' ?
                                        groups.find(g => g.id === activeUser)?.name || activeUser.split('_')[0]
                                        : activeUser
                                    }
                                </h2>
                                <p className="text-xs text-gray-400">
                                    {activeChatType === 'group' ? 'Group' : 'Online'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-gray-300">
                            <FaEllipsisV className="cursor-pointer hover:text-white transition-colors" size={16} />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-3 bg-[#202c33] border-b border-[#374248]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#2a3942] flex justify-center items-center text-gray-400">
                                💬
                            </div>
                            <div>
                                <h2 className="font-semibold text-white">WhatsApp</h2>
                                <p className="text-xs text-gray-400">Select a user to start chatting</p>
                            </div>
                        </div>
                    </div>
                )}

                <ChatArea
                    fileInputRef={fileInputRef}
                    activeUser={activeUser}
                    chat={chat}
                    uploading={uploading}
                    username={username}
                    onOpenMedia={openMediaModal}
                    activeChatType={activeChatType}
                    onShowVoiceRecorder={() => setShowVoiceRecorder(true)}
                    onPaperClipClick={handlePaperClipClick}
                    onSendMessage={sendMessage}
                />

                {/* File Type Selection Modal */}
                {showFileTypeModal && (
                    <FileTypeModal
                        onClose={() => setShowFileTypeModal(false)}
                        onFileTypeSelect={handleFileTypeSelect}
                    />
                )}

                {/* Voice Recorder Modal */}
                {showVoiceRecorder && (
                    <VoiceRecorder
                        onRecordingComplete={handleVoiceRecordComplete}
                        onClose={() => setShowVoiceRecorder(false)}
                    />
                )}

                {/* Media Modal */}
                <MediaModal
                    isOpen={!!modalContent}
                    onClose={closeMediaModal}
                    content={modalContent}
                    type={modalType}
                />
            </div>
        </div>
    );
}