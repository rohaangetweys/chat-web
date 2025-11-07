'use client';
import React from 'react';
import Image from 'next/image';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import { getFileIcon, getFileTypeName } from './utils';
import { useTheme } from '@/contexts/ThemeContext';

export default function MessageBubble({ msg, index, username, getProfilePhoto, onOpenMedia, activeChatType }) {
    const isOwnMessage = msg.username === username;
    const profilePhoto = getProfilePhoto(msg.username);
    const { isDark } = useTheme();

    return (
        <div className={`max-w-[85%] md:max-w-[70%] break-all h-auto min-w-[15%] p-3 rounded-2xl shadow-sm ${isOwnMessage ? 'ml-auto bg-[#00a884] text-white' : isDark ? 'mr-auto bg-gray-700 text-white border-gray-600' : 'mr-auto bg-white text-gray-800 border border-gray-200'}`}>
            {(msg.username !== username || activeChatType === 'group') && (
                <div className="flex items-center gap-2 mb-1">
                    {profilePhoto ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden">
                            <Image src={profilePhoto} alt={msg.username} width={24} height={24} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-[#00a884] flex items-center justify-center text-white text-xs font-semibold">{msg.username?.slice(0, 1)?.toUpperCase()}</div>
                    )}
                    <p className="text-xs text-[#00a884] font-medium">{msg.username}</p>
                </div>
            )}

            {msg.type === 'image' ? (
                <div className="my-1">
                    <div className="relative cursor-pointer group" onClick={() => onOpenMedia(msg.message, 'image')}>
                        <Image src={msg.message} alt={msg.fileName || 'Uploaded image'} width={300} height={200} className="rounded-2xl max-w-full h-auto object-cover transition-transform group-hover:scale-105 border border-gray-200" style={{ maxHeight: '300px' }} />
                    </div>
                    {msg.fileName && <p className={`text-xs mt-1 ${isOwnMessage ? 'text-gray-200' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>{msg.fileName}</p>}
                </div>
            ) : msg.type === 'video' ? (
                <div className="my-1">
                    <div className="relative cursor-pointer group" onClick={() => onOpenMedia(msg.message, 'video')}>
                        <video className="rounded-2xl max-w-full h-auto border border-gray-200" style={{ maxHeight: '400px' }} controls>
                            <source src={msg.message} type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-2xl flex items-center justify-center">
                            <div className="group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-full p-3">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" className="fill-white"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                        </div>
                    </div>
                    {msg.fileName && <p className={`text-xs mt-1 ${isOwnMessage ? 'text-gray-200' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>{msg.fileName}</p>}
                </div>
            ) : msg.type === 'audio' ? (
                <VoiceMessagePlayer msg={msg} index={index} username={username} />
            ) : msg.type === 'file' ? (
                <div className="my-1">
                    <div className={`flex items-center gap-3 p-3 ${isDark ? 'bg-gray-600 border-gray-500 hover:bg-gray-500' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'} rounded-2xl border transition-colors cursor-pointer group`} onClick={() => window.open(msg.message, '_blank', 'noopener,noreferrer')} title="Click to open document">
                        <div className="shrink-0">{getFileIcon(msg.fileName, msg.format)}</div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isOwnMessage ? 'text-white' : isDark ? 'text-white' : 'text-gray-800'}`}>{msg.fileName || 'Document'}</p>
                            <p className={`text-xs ${isOwnMessage ? 'text-gray-200' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>{getFileTypeName(msg.fileName, msg.format)}</p>
                        </div>
                        <div className="shrink-0 flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); const link = document.createElement('a'); link.href = msg.message; link.target = '_blank'; link.rel = 'noopener noreferrer'; document.body.appendChild(link); link.click(); document.body.removeChild(link); }} className={`p-2 rounded-full transition-colors ${isOwnMessage ? 'text-gray-200 hover:text-white hover:bg-[#008f70]' : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-400' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-300'}`} title="Download file">⬇️</button>
                            <div className={`p-2 transition-colors ${isOwnMessage ? 'text-gray-200 group-hover:text-white' : isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-400 group-hover:text-[#00a884]'}`}>🔗</div>
                        </div>
                    </div>
                </div>
            ) : (
                <p className={`text-left whitespace-pre-wrap break-words ${isOwnMessage ? 'text-white' : isDark ? 'text-white' : 'text-gray-800'}`}>{msg.message}</p>
            )}

            <p className={`text-xs mt-2 text-right ${isOwnMessage ? 'text-gray-200' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>{msg.time}</p>
        </div>
    );
}