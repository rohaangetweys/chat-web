'use client';
import React, { useEffect, useRef, useState } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { getProfilePhoto, getActiveUserStatus } from '../../utils/chatArea';
import { FaArrowLeft, FaPhone, FaVideo, FaEllipsisV, FaComments, FaComment, FaBan, FaTrash } from 'react-icons/fa';
import { HiOutlineUserGroup } from 'react-icons/hi2';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';

export default function ChatArea({ activeUser, chat = [], username, uploading, fileInputRef, onOpenMedia, activeChatType, onPaperClipClick, onSendMessage, userProfiles, onlineStatus, groups, isMobileView, onBackToSidebar, onStartVoiceCall, onStartVideoCall, onClearChat, blockedUsers, onBlockUser, onUnblockUser }) {
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingComplete, setRecordingComplete] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [showOptions, setShowOptions] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const durationIntervalRef = useRef(null);
    const messagesEndRef = useRef(null);
    const optionsRef = useRef(null);
    const { isDark } = useTheme();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target)) {
                setShowOptions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

    const startRecording = async () => {
        if (!activeUser) return;

        setIsRecording(true);
        setRecordingComplete(false);
        setDuration(0);
        setAudioBlob(null);
        audioChunksRef.current = [];

        durationIntervalRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                setRecordingComplete(true);
                if (audioChunksRef.current.length > 0) {
                    const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                    setAudioBlob(blob);
                }
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
        } catch (err) {
            console.error("Microphone access error:", err);
            alert("Microphone access is blocked or unsupported on this device.");
            stopRecording();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
        }
        setIsRecording(false);
    };

    const cancelRecording = () => {
        stopRecording();
        setRecordingComplete(false);
        setAudioBlob(null);
        setDuration(0);
        audioChunksRef.current = [];
    };

    const sendRecording = () => {
        let blobToSend = audioBlob;

        if (!blobToSend && audioChunksRef.current.length > 0) {
            blobToSend = new Blob(audioChunksRef.current, { type: "audio/webm" });
        }

        if (blobToSend) {
            onSendMessage('', 'audio', blobToSend, duration);
            setRecordingComplete(false);
            setAudioBlob(null);
            setDuration(0);
            audioChunksRef.current = [];
        } else {
            console.error('No audio data to send');
            alert('No recording data found');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') sendMessage(e);
    };

    const getProfilePhotoUrl = (username) => {
        return getProfilePhoto(username, userProfiles);
    };

    const isUserBlocked = activeChatType === 'individual' && blockedUsers.includes(activeUser);

    const handleBlockUser = () => {
        if (activeChatType === 'individual' && activeUser) {
            onBlockUser(activeUser);
            setShowOptions(false);
        }
    };

    const handleUnblockUser = () => {
        if (activeChatType === 'individual' && activeUser) {
            onUnblockUser(activeUser);
            setShowOptions(false);
        }
    };

    const handleClearChat = () => {
        if (activeUser) {
            onClearChat(activeUser, activeChatType);
            setShowOptions(false);
        }
    };

    return (
        <>
            {activeUser ? (
                <div className={`flex items-center justify-between p-3 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border-b relative`}>
                    <div className="flex items-center gap-2">
                        {isMobileView && (
                            <button
                                onClick={onBackToSidebar}
                                className={`p-1.5 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
                            >
                                <FaArrowLeft size={16} />
                            </button>
                        )}
                        <div className="relative">
                            {activeChatType === 'group' ? (
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex justify-center items-center text-white">
                                    <HiOutlineUserGroup size={18} />
                                </div>
                            ) : getProfilePhotoUrl(activeUser) ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#0084ff]">
                                    <Image src={getProfilePhotoUrl(activeUser)} alt={activeUser} width={32} height={32} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-[#0084ff] flex justify-center items-center text-white text-sm font-semibold">
                                    {activeUser.slice(0, 1).toUpperCase()}
                                </div>
                            )}
                            {activeChatType === 'individual' && onlineStatus?.[activeUser]?.online && !isUserBlocked && (
                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                            )}
                        </div>
                        <div>
                            <h2 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {activeChatType === 'group' ?
                                    groups?.find(g => g.id === activeUser)?.name || activeUser.split('_')[0]
                                    : activeUser
                                }
                                {isUserBlocked && (
                                    <span className="ml-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">Blocked</span>
                                )}
                            </h2>
                            <div className="flex items-center gap-1">
                                {activeChatType === 'individual' && onlineStatus?.[activeUser]?.online && !isUserBlocked ? (
                                    <>
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                        <p className="text-xs text-green-600 font-medium">Online</p>
                                    </>
                                ) : (
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {isUserBlocked ? 'User blocked' : getActiveUserStatus(activeChatType, activeUser, onlineStatus, groups)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={`flex items-center gap-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} ref={optionsRef}>
                        {activeChatType === 'individual' && onlineStatus?.[activeUser]?.online && !isUserBlocked && (
                            <>
                                <button
                                    onClick={onStartVoiceCall}
                                    className={`cursor-pointer p-1.5 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`}
                                    title="Voice Call"
                                >
                                    <FaPhone size={14} />
                                </button>

                                <button
                                    onClick={onStartVideoCall}
                                    className={`cursor-pointer p-1.5 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`}
                                    title="Video Call"
                                >
                                    <FaVideo size={14} />
                                </button>
                            </>
                        )}

                        <div className="relative">
                            <button
                                onClick={() => setShowOptions(!showOptions)}
                                className={`cursor-pointer p-1.5 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`}
                            >
                                <FaEllipsisV size={14} />
                            </button>

                            {showOptions && (
                                <div className={`absolute right-0 top-full mt-1 w-48 rounded-lg shadow-lg z-50 ${isDark ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'}`}>
                                    <div className="p-1">
                                        {activeChatType === 'individual' && (
                                            <>
                                                {!isUserBlocked ? (
                                                    <button
                                                        onClick={handleBlockUser}
                                                        className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <FaBan size={12} />
                                                        Block User
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={handleUnblockUser}
                                                        className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-green-600 hover:bg-green-50 transition-colors"
                                                    >
                                                        <FaBan size={12} />
                                                        Unblock User
                                                    </button>
                                                )}
                                                <div className="border-t my-1 border-gray-200"></div>
                                            </>
                                        )}
                                        <button
                                            onClick={handleClearChat}
                                            className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <FaTrash size={12} />
                                            Clear Chat
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`flex items-center justify-between p-3 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border-b`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex justify-center items-center`}>
                            <FaComments className={isDark ? 'text-gray-400' : 'text-gray-500'} size={16} />
                        </div>
                        <div>
                            <h2 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>Chat App</h2>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Select a contact to start chatting</p>
                        </div>
                    </div>
                </div>
            )}

            <div className={`flex-1 p-3 overflow-y-auto ${isDark ? 'bg-gray-900' : 'bg-gray-100'} relative`}>
                <div className="flex flex-col space-y-1 mx-auto">
                    {!activeUser ? (
                        <div className="text-center mt-16">
                            <div className={`w-16 h-16 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full flex items-center justify-center mx-auto mb-3`}>
                                <FaComment className="text-2xl text-gray-400" />
                            </div>
                            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Welcome to Chat</h3>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Select a contact from the sidebar to start a conversation</p>
                        </div>
                    ) : isUserBlocked ? (
                        <div className="text-center mt-16">
                            <div className={`w-14 h-14 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full flex items-center justify-center mx-auto mb-3`}>
                                <FaBan className="text-xl text-red-500" />
                            </div>
                            <h3 className={`text-md font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                                User Blocked
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                You have blocked this user. Unblock to send messages.
                            </p>
                            <button
                                onClick={handleUnblockUser}
                                className="mt-3 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                            >
                                Unblock User
                            </button>
                        </div>
                    ) : chat.length > 0 ? (
                        <MessageList chat={chat} username={username} getProfilePhoto={getProfilePhotoUrl} onOpenMedia={onOpenMedia} activeChatType={activeChatType} />
                    ) : (
                        <div className="text-center mt-16">
                            <div className={`w-14 h-14 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full flex items-center justify-center mx-auto mb-3`}>
                                <FaComment className="text-xl text-gray-400" />
                            </div>
                            <h3 className={`text-md font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                                {activeChatType === 'group' ? 'Group created!' : 'Say hello!'}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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

            {activeUser && (<ChatInput activeUser={activeUser} uploading={uploading} fileInputRef={fileInputRef} onStartRecording={startRecording} onStopRecording={stopRecording} onCancelRecording={cancelRecording} onSendRecording={sendRecording} isRecording={isRecording} recordingComplete={recordingComplete} duration={duration} audioBlob={audioBlob} onSendMessage={sendMessage} message={message} setMessage={setMessage} onKeyDown={handleKeyDown} activeChatType={activeChatType} onFileTypeSelect={onPaperClipClick} isUserBlocked={isUserBlocked} />)}
        </>
    );
}