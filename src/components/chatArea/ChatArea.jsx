'use client';
import React, { useEffect, useRef, useState } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import EmptyChat from './EmptyChat';
import { getProfilePhoto } from './utils';

export default function ChatArea({ activeUser, chat = [], username, uploading, fileInputRef, onOpenMedia, activeChatType, onShowVoiceRecorder, onPaperClipClick, onSendMessage, userProfiles }) {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef(null);

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

    return (
        <>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-100 relative">
                <div className="flex flex-col space-y-2 mx-auto">
                    {!activeUser ? (
                        <EmptyChat />
                    ) : chat.length > 0 ? (
                        <MessageList chat={chat} username={username} getProfilePhoto={(u) => getProfilePhoto(u, userProfiles)} onOpenMedia={onOpenMedia} activeChatType={activeChatType} />
                    ) : (
                        <div className="text-center mt-20">
                            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <span className="text-2xl text-gray-400">👋</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">{activeChatType === 'group' ? 'Group created!' : 'Say hello!'}</h3>
                            <p className="text-gray-500">{activeChatType === 'group' ? 'Send the first message in this group' : 'Send your first message to start the conversation'}</p>
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
