'use client';
import React, { useEffect, useRef, useState } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { getProfilePhoto, getActiveUserStatus } from '../../utils/chatArea';
import { FaArrowLeft, FaPhone, FaEllipsisV, FaComments, FaComment } from 'react-icons/fa';
import { HiOutlineUserGroup } from 'react-icons/hi2';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';

export default function ChatArea({ activeUser, chat = [], username, uploading, fileInputRef, onOpenMedia, activeChatType, onPaperClipClick, onSendMessage, userProfiles, onlineStatus, groups, isMobileView, onBackToSidebar, onStartVoiceCall }) {
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingComplete, setRecordingComplete] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const durationIntervalRef = useRef(null);
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
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                setRecordingComplete(true);
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
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
    };

    const sendRecording = () => {
        if (audioBlob) {
            // Call the parent's sendMessage function with the audio blob
            // You'll need to modify your onSendMessage to handle audio files
            onSendMessage('', 'audio', audioBlob, duration);
            setRecordingComplete(false);
            setAudioBlob(null);
            setDuration(0);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') sendMessage(e);
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
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#0084ff]">
                                    <Image
                                        src={getProfilePhotoUrl(activeUser)}
                                        alt={activeUser}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-[#0084ff] flex justify-center items-center text-white font-semibold">
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
                                        {getActiveUserStatus(activeChatType, activeUser, onlineStatus, groups)}
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
                        <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex justify-center items-center`}>
                            <FaComments className={isDark ? 'text-gray-400' : 'text-gray-500'} size={20} />
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
                        <div className="text-center mt-20">
                            <div className={`w-24 h-24 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner`}>
                                <FaComment className="text-4xl text-gray-400" />
                            </div>
                            <h3 className={`text-xl font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Welcome to Chat</h3>
                            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Select a contact from the sidebar to start a conversation</p>
                        </div>
                    ) : chat.length > 0 ? (
                        <MessageList chat={chat} username={username} getProfilePhoto={getProfilePhotoUrl} onOpenMedia={onOpenMedia} activeChatType={activeChatType} />
                    ) : (
                        <div className="text-center mt-20">
                            <div className={`w-20 h-20 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner`}>
                                <FaComment className="text-2xl text-gray-400" />
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

            {activeUser && (
                <ChatInput
                    activeUser={activeUser}
                    uploading={uploading}
                    fileInputRef={fileInputRef} // Make sure this is passed
                    onStartRecording={startRecording}
                    onStopRecording={stopRecording}
                    onCancelRecording={cancelRecording}
                    onSendRecording={sendRecording}
                    isRecording={isRecording}
                    recordingComplete={recordingComplete}
                    duration={duration}
                    audioBlob={audioBlob}
                    onSendMessage={sendMessage}
                    message={message}
                    setMessage={setMessage}
                    onKeyDown={handleKeyDown}
                    activeChatType={activeChatType}
                    onFileTypeSelect={onPaperClipClick} // This can be kept for any additional logic
                />
            )}
        </>
    );
}