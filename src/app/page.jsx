'use client';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, push, set } from "firebase/database";
import { auth, db, logout } from "@/lib/firebase";
import { Toaster, toast } from "react-hot-toast";
import { FaPhone, FaVideo, FaEllipsisV, FaArrowLeft, FaSignOutAlt } from "react-icons/fa";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import MediaModal from "@/components/MediaModal";
import VoiceRecorder from "@/components/VoiceRecorder";
import FileTypeModal from "@/components/FileTypeModal";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { HiOutlineUserGroup } from "react-icons/hi2";

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
    const [unreadCounts, setUnreadCounts] = useState({});
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    const fileInputRef = useRef(null);
    const profileDropdownRef = useRef(null);

    const handleLogout = async () => {
        const res = await logout();
        if (res?.success) {
            toast.success("Logged out");
            router.push("/login");
        } else {
            toast.error("Logout failed");
            console.error(res);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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

            // Mark messages as read when chat is active
            if (activeUser) {
                markMessagesAsRead(activeUser, activeChatType);
            }
        });

        return () => unsub();
    }, [activeUser, username, activeChatType]);

    // Track unread messages for all conversations
    useEffect(() => {
        if (!username) return;

        const unsubscribeFunctions = [];
        const newUnreadCounts = {};

        // Individual chats
        users.forEach((user) => {
            if (user === username) return;

            const chatId = username < user ? `${username}_${user}` : `${user}_${username}`;
            const chatRef = ref(db, `chats/${chatId}`);

            const unsubscribe = onValue(chatRef, (snapshot) => {
                if (!snapshot.exists()) {
                    newUnreadCounts[user] = 0;
                    return;
                }

                const messages = [];
                snapshot.forEach((child) => {
                    const message = child.val();
                    messages.push({
                        id: child.key,
                        ...message
                    });
                });

                // Get last read time from localStorage
                const lastReadKey = `lastRead_${username}_${user}`;
                const lastRead = parseInt(localStorage.getItem(lastReadKey)) || 0;

                // Count unread messages (messages after last read time)
                const unread = messages.filter(msg =>
                    msg.timestamp > lastRead && msg.username !== username
                ).length;

                newUnreadCounts[user] = unread;
                setUnreadCounts(prev => ({ ...prev, [user]: unread }));
            });

            unsubscribeFunctions.push(unsubscribe);
        });

        // Group chats
        groups.forEach((group) => {
            const messagesRef = ref(db, `groupChats/${group.id}/messages`);

            const unsubscribe = onValue(messagesRef, (snapshot) => {
                if (!snapshot.exists()) {
                    newUnreadCounts[group.id] = 0;
                    return;
                }

                const messages = [];
                snapshot.forEach((child) => {
                    const message = child.val();
                    messages.push({
                        id: child.key,
                        ...message
                    });
                });

                // Get last read time from localStorage
                const lastReadKey = `lastRead_${username}_${group.id}`;
                const lastRead = parseInt(localStorage.getItem(lastReadKey)) || 0;

                // Count unread messages (messages after last read time)
                const unread = messages.filter(msg =>
                    msg.timestamp > lastRead && msg.username !== username
                ).length;

                newUnreadCounts[group.id] = unread;
                setUnreadCounts(prev => ({ ...prev, [group.id]: unread }));
            });

            unsubscribeFunctions.push(unsubscribe);
        });

        setUnreadCounts(newUnreadCounts);

        return () => {
            unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        };
    }, [users, groups, username]);

    const markMessagesAsRead = (target, type = 'individual') => {
        if (!username) return;

        const lastReadKey = type === 'individual'
            ? `lastRead_${username}_${target}`
            : `lastRead_${username}_${target}`;

        localStorage.setItem(lastReadKey, Date.now().toString());

        // Update unread counts
        setUnreadCounts(prev => ({
            ...prev,
            [target]: 0
        }));
    };

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

        // Mark messages as read when selecting a chat
        markMessagesAsRead(user, type);

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
            <div className="h-full w-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex flex-col h-full w-full px-20 py-10 border bg-gray-300 text-gray-800 overflow-hidden justify-center items-center">
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    style: {
                        background: '#00a884',
                        color: 'white',
                        border: '1px solid #00a884',
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

            <header className="px-6 border bg-white border-gray-300 w-full h-20 rounded-3xl flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="bg-[#00a884] text-white px-6 h-10 rounded-xl flex items-center justify-center opacity-50 text-xl font-semibold">
                        <h1 className="text-2xl font-bold tracking-wide">Chat App</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full text-[#00a884] hover:bg-gray-200 transition-colors">
                        <MdOutlineNotificationsActive className="text-[#00a884] text-[26px] hover:bg-gray-200 transition-colors" />
                    </div>
                    
                    {/* Profile Button with Dropdown */}
                    <div className="relative" ref={profileDropdownRef}>
                        <button
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            className="p-2 rounded-full text-[#00a884] hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            <FaUserCircle className="text-[#00a884] text-[26px]" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showProfileDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                                    <p className="font-medium">Hello, {username}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    <FaSignOutAlt className="mr-2 text-gray-500" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex w-full h-full overflow-hidden border border-gray-300 gap-4">
                {/* Sidebar - Conditionally rendered based on mobile view */}
                <div className={`flex rounded-3xl overflow-hidden ${isMobileView ? (showSidebar ? 'flex' : 'hidden') : 'flex'} ${isMobileView ? 'w-full' : 'w-1/4'}`}>
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
                        unreadCounts={unreadCounts}
                    />
                </div>

                {/* Chat Area - Conditionally rendered based on mobile view */}
                <div className={`rounded-3xl overflow-hidden ${isMobileView ? (showSidebar ? 'hidden' : 'flex') : 'flex'} flex-1 flex-col bg-gray-50`}>
                    {/* Chat Header with Back Button for Mobile */}
                    {activeUser ? (
                        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                {isMobileView && (
                                    <button
                                        onClick={handleBackToSidebar}
                                        className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                        <FaArrowLeft size={18} />
                                    </button>
                                )}
                                <div className="relative">
                                    <div className={`w-10 h-10 rounded-full flex justify-center items-center text-white font-semibold ${activeChatType === 'group' ? 'bg-indigo-500' : 'bg-[#00a884]'
                                        }`}>
                                        {activeChatType === 'group' ? <HiOutlineUserGroup size={22} /> : activeUser.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00a884] rounded-full border-2 border-white"></div>
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-800">
                                        {activeChatType === 'group' ?
                                            groups.find(g => g.id === activeUser)?.name || activeUser.split('_')[0]
                                            : activeUser
                                        }
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        {activeChatType === 'group' ? 'Group' : 'Online'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 text-gray-600">
                                <FaEllipsisV className="cursor-pointer hover:text-gray-800 transition-colors" size={16} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex justify-center items-center text-gray-500">
                                    💬
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-800">Chat App</h2>
                                    <p className="text-xs text-gray-500">Select a contact to start chatting</p>
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
        </div>
    );
}