'use client';
import React from 'react';
import Image from 'next/image';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import { getFileIcon, getFileTypeName } from '../../utils/chatArea';
import { useTheme } from '@/contexts/ThemeContext';

export default function MessageList({ chat, username, getProfilePhoto, onOpenMedia, activeChatType }) {
    const { isDark } = useTheme();

    return (
        <div className="flex flex-col gap-3 p-4">
            {chat.map((msg, i) => {
                const isOwnMessage = msg.username === username;
                const profilePhoto = getProfilePhoto(msg.username);

                return (
                    <div
                        key={msg.id || i}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} w-full`}
                    >
                        <div
                            className={`relative max-w-[80%] md:max-w-[70%] px-4 py-2 rounded-3xl text-sm leading-relaxed shadow
                            ${isOwnMessage
                                ? 'bg-[#0084ff] text-white rounded-tr-none'
                                : 'bg-[#f1f0f0] text-gray-800 rounded-tl-none'
                            }`}
                        >
                            {/* Username for group chats */}
                            {(msg.username !== username || activeChatType === 'group') && (
                                <div className="flex items-center gap-2 mb-1">
                                    {profilePhoto ? (
                                        <div className="w-6 h-6 rounded-full overflow-hidden">
                                            <Image
                                                src={profilePhoto}
                                                alt={msg.username}
                                                width={24}
                                                height={24}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-[#0084ff] flex items-center justify-center text-white text-xs font-semibold">
                                            {msg.username?.slice(0, 1)?.toUpperCase()}
                                        </div>
                                    )}
                                    <p className="text-xs text-[#0084ff] font-medium">{msg.username}</p>
                                </div>
                            )}

                            {/* Message Type Handling */}
                            {msg.type === 'image' ? (
                                <div className="my-1">
                                    <div
                                        className="relative cursor-pointer group"
                                        onClick={() => onOpenMedia(msg.message, 'image')}
                                    >
                                        <Image
                                            src={msg.message}
                                            alt={msg.fileName || 'Uploaded image'}
                                            width={300}
                                            height={200}
                                            className="rounded-2xl max-w-full h-auto object-cover transition-transform group-hover:scale-105"
                                            style={{ maxHeight: '300px' }}
                                        />
                                    </div>
                                    {msg.fileName && (
                                        <p
                                            className={`text-xs mt-1 ${isOwnMessage ? 'text-gray-200' : 'text-gray-500'}`}
                                        >
                                            {msg.fileName}
                                        </p>
                                    )}
                                </div>
                            ) : msg.type === 'video' ? (
                                <div className="my-1">
                                    <div
                                        className="relative cursor-pointer group"
                                        onClick={() => onOpenMedia(msg.message, 'video')}
                                    >
                                        <video
                                            className="rounded-2xl max-w-full h-auto"
                                            style={{ maxHeight: '400px' }}
                                            controls
                                        >
                                            <source src={msg.message} type="video/mp4" />
                                        </video>
                                    </div>
                                    {msg.fileName && (
                                        <p
                                            className={`text-xs mt-1 ${isOwnMessage ? 'text-gray-200' : 'text-gray-500'}`}
                                        >
                                            {msg.fileName}
                                        </p>
                                    )}
                                </div>
                            ) : msg.type === 'audio' ? (
                                <div className="my-1 w-[240px] sm:w-[260px] md:w-[280px] lg:w-[300px]">
                                    <VoiceMessagePlayer msg={msg} index={i} username={username} />
                                </div>
                            ) : msg.type === 'file' ? (
                                <div
                                    className="flex items-center gap-3 p-3 bg-white border rounded-2xl cursor-pointer hover:bg-gray-50 transition"
                                    onClick={() => window.open(msg.message, '_blank', 'noopener,noreferrer')}
                                >
                                    <div className="shrink-0">{getFileIcon(msg.fileName, msg.format)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{msg.fileName || 'Document'}</p>
                                        <p className="text-xs text-gray-500">
                                            {getFileTypeName(msg.fileName, msg.format)}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                            )}

                            {/* Time */}
                            <p
                                className={`text-[10px] mt-1 text-right ${
                                    isOwnMessage ? 'text-white/70' : 'text-gray-500'
                                }`}
                            >
                                {msg.time}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
