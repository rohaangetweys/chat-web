'use client';
import React, { useEffect, useRef, useState } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import EmptyChat from './EmptyChat';
import { getProfilePhoto } from './utils';
import { FaArrowLeft, FaPhone, FaEllipsisV } from 'react-icons/fa';
import { HiOutlineUserGroup } from 'react-icons/hi2';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';

export default function ChatArea({
    activeUser,
    chat = [],
    username,
    uploading,
    fileInputRef,
    onOpenMedia,
    activeChatType,
    onShowVoiceRecorder,
    onPaperClipClick,
    onSendMessage,
    userProfiles,
    onlineStatus,
    groups,
    isMobileView,
    onBackToSidebar,
    onStartVoiceCall
}) {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef(null);
    const { isDark } = useTheme();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat]);

    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!message.trim() || !activeUser || !username) return;
        try {
            await onSendMessage(message.trim());
            setMessage('');
        } catch (err) {
            console.error('sendMessage error:', err);
        }
    };

    const handleVoiceRecordClick = () => {
        if (!activeUser) return;
        onShowVoiceRecorder();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') sendMessage(e);
    };

    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return 'Unknown';

        const lastSeenDate = new Date(lastSeen);
        const now = new Date();
        const diffInMs = now - lastSeenDate;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInMinutes < 1) {
            return 'Just now';
        } else if (diffInMinutes < 60) {
            return `Last active ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        } else if (diffInHours < 24) {
            return `Last active ${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        } else if (diffInDays < 7) {
            return `Last active ${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        } else {
            return `Last active on ${lastSeenDate.toLocaleDateString()}`;
        }
    };

    const getActiveUserStatus = () => {
        if (activeChatType === 'group') {
            const group = groups?.find(g => g.id === activeUser);
            const memberCount = group?.members?.length || 0;
            return `${memberCount} members`;
        }

        if (!activeUser || !onlineStatus?.[activeUser]) {
            return 'Unknown';
        }

        const userStatus = onlineStatus[activeUser];
        if (userStatus.online) {
            return 'Online';
        } else if (userStatus.lastSeen) {
            return formatLastSeen(userStatus.lastSeen);
        } else {
            return 'Offline';
        }
    };

    const getProfilePhotoUrl = (username) => {
        return getProfilePhoto(username, userProfiles);
    };

    return (
        <>
            {activeUser ? (
                <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border-b shadow-sm`}>
                    <div className="flex items-center gap-3">
                        {isMobileView && (
                            <button
                                onClick={onBackToSidebar}
                                className={`p-2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
                            >
                                <FaArrowLeft size={18} />
                            </button>
                        )}
                        <div className="relative">
                            {activeChatType === 'group' ? (
                                <div className="w-10 h-10 rounded-full bg-indigo-500 flex justify-center items-center text-white">
                                    <HiOutlineUserGroup size={22} />
                                </div>
                            ) : getProfilePhotoUrl(activeUser) ? (
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#00a884]">
                                    <Image
                                        src={getProfilePhotoUrl(activeUser)}
                                        alt={activeUser}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-[#00a884] flex justify-center items-center text-white font-semibold">
                                    {activeUser.slice(0, 1).toUpperCase()}
                                </div>
                            )}
                            {activeChatType === 'individual' && onlineStatus?.[activeUser]?.online && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                        </div>
                        <div>
                            <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {activeChatType === 'group' ?
                                    groups?.find(g => g.id === activeUser)?.name || activeUser.split('_')[0]
                                    : activeUser
                                }
                            </h2>
                            <div className="flex items-center gap-2">
                                {activeChatType === 'individual' && onlineStatus?.[activeUser]?.online ? (
                                    <>
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <p className="text-xs text-green-600 font-medium">Online</p>
                                    </>
                                ) : (
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {getActiveUserStatus()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={`flex items-center gap-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {activeChatType === 'individual' && (
                            <button
                                onClick={onStartVoiceCall}
                                className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`}
                                title="Voice Call"
                            >
                                <FaPhone size={16} />
                            </button>
                        )}
                        <FaEllipsisV className={`cursor-pointer ${isDark ? 'hover:text-gray-200' : 'hover:text-gray-800'} transition-colors`} size={16} />
                    </div>
                </div>
            ) : (
                <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border-b shadow-sm`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'} flex justify-center items-center`}>
                            💬
                        </div>
                        <div>
                            <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Chat App</h2>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Select a contact to start chatting</p>
                        </div>
                    </div>
                </div>
            )}

            <div className={`flex-1 p-4 overflow-y-auto ${isDark ? 'bg-gray-900' : 'bg-gray-100'} relative`}>
                <div className="flex flex-col space-y-2 mx-auto">
                    {!activeUser ? (
                        <EmptyChat />
                    ) : chat.length > 0 ? (
                        <MessageList
                            chat={chat}
                            username={username}
                            getProfilePhoto={getProfilePhotoUrl}
                            onOpenMedia={onOpenMedia}
                            activeChatType={activeChatType}
                        />
                    ) : (
                        <div className="text-center mt-20">
                            <div className={`w-20 h-20 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner`}>
                                <span className="text-2xl text-gray-400">👋</span>
                            </div>
                            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                {activeChatType === 'group' ? 'Group created!' : 'Say hello!'}
                            </h3>
                            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                {activeChatType === 'group'
                                    ? 'Send the first message in this group'
                                    : 'Send your first message to start the conversation'
                                }
                            </p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <ChatInput
                activeUser={activeUser}
                uploading={uploading}
                fileInputRef={fileInputRef}
                onPaperClipClick={onPaperClipClick}
                onShowVoiceRecorder={handleVoiceRecordClick}
                onSendMessage={sendMessage}
                message={message}
                setMessage={setMessage}
                onKeyDown={handleKeyDown}
                activeChatType={activeChatType}
            />
        </>
    );
}