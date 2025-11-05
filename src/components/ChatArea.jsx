'use client'
import { db } from '@/lib/firebase';
import { push, ref } from 'firebase/database';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaPaperPlane, FaFilePdf, FaFileWord, FaFileArchive, FaFile, FaDownload, FaPlay, FaExternalLinkAlt } from 'react-icons/fa';
import { GoPaperclip } from 'react-icons/go';

export default function ChatArea({ activeUser, chat, username, uploading, fileInputRef, onOpenMedia, activeChatType }) {
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!message.trim() || !activeUser || !username) return;

        let chatRef;
        if (activeChatType === "individual") {
            const chatId =
                username < activeUser
                    ? `${username}_${activeUser}`
                    : `${activeUser}_${username}`;
            chatRef = ref(db, `chats/${chatId}`);
        } else {
            // Group chat - push to messages subnode
            chatRef = ref(db, `groupChats/${activeUser}/messages`);
        }

        try {
            await push(chatRef, {
                username,
                message: message.trim(),
                type: "text",
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            });
            setMessage("");
        } catch (err) {
            console.error("sendMessage error:", err);
            toast.error("Failed to send message");
        }
    };

    const handlePaperClipClick = () => {
        if (!activeUser) {
            toast.error('Please select a user to chat with');
            return;
        }
        fileInputRef.current?.click();
    };

    const getFileIcon = (fileName, format) => {
        const fileExt = fileName?.split('.').pop()?.toLowerCase() || format?.toLowerCase();
        if (fileExt === 'pdf') return <FaFilePdf className="text-red-500" size={24} />;
        if (['doc', 'docx'].includes(fileExt)) return <FaFileWord className="text-blue-500" size={24} />;
        if (['zip', 'rar', '7z'].includes(fileExt)) return <FaFileArchive className="text-yellow-500" size={24} />;
        if (['txt'].includes(fileExt)) return <FaFile className="text-gray-300" size={24} />;
        return <FaFile className="text-gray-400" size={24} />;
    };

    const getFileTypeName = (fileName, format) => {
        const fileExt = fileName?.split('.').pop()?.toLowerCase() || format?.toLowerCase();
        const typeMap = {
            pdf: 'PDF Document',
            doc: 'Word Document',
            docx: 'Word Document',
            zip: 'ZIP Archive',
            rar: 'RAR Archive',
            '7z': '7-Zip Archive',
            txt: 'Text File',
        };
        return typeMap[fileExt] || 'Document';
    };

    const handleDocumentClick = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleDownload = async (url, fileName) => {
        try {
            let downloadUrl = url;
            if (url.includes('cloudinary.com') && !url.includes('/image/') && !url.includes('/video/')) {
                downloadUrl = url.split('?')[0];
            }

            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName || 'download';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Download started');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Download failed');
        }
    };

    return (
        <>
            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-cover bg-center relative">
                <div className="flex flex-col space-y-2 mx-auto">
                    {!activeUser ? (
                        <div className="text-center mt-20">
                            <div className="w-24 h-24 bg-[#2a3942] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">💬</span>
                            </div>
                            <h3 className="text-xl font-light text-gray-300 mb-2">Welcome to WhatsApp</h3>
                            <p className="text-gray-400">Select a user from the sidebar to start a conversation</p>
                        </div>
                    ) : chat.length > 0 ? (
                        chat.map((msg, i) => (
                            <div
                                key={i}
                                className={`max-w-[70%] h-auto p-3 rounded-lg ${msg.username === username
                                    ? "ml-auto bg-[#005c4b] text-white"
                                    : "mr-auto bg-[#2a3942] text-white"
                                    }`}
                            >
                                {(msg.username !== username || activeChatType === 'group') && (
                                    <p className="text-xs text-[#00a884] font-medium mb-1">
                                        {msg.username}
                                    </p>
                                )}

                                {msg.type === "image" ? (
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
                                                className="rounded-lg max-w-full h-auto object-cover transition-transform group-hover:scale-105"
                                                style={{ maxHeight: '300px' }}
                                            />
                                        </div>
                                        {msg.fileName && (
                                            <p className="text-xs text-gray-300 mt-1">{msg.fileName}</p>
                                        )}
                                    </div>
                                ) : msg.type === "video" ? (
                                    <div className="my-1">
                                        <div
                                            className="relative cursor-pointer group"
                                            onClick={() => onOpenMedia(msg.message, 'video')}
                                        >
                                            <video
                                                className="rounded-lg max-w-full h-auto"
                                                style={{ maxHeight: '400px' }}
                                                controls
                                            >
                                                <source src={msg.message} type="video/mp4" />
                                            </video>
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-full p-3">
                                                    <FaPlay className="text-white" size={16} />
                                                </div>
                                            </div>
                                        </div>
                                        {msg.fileName && (
                                            <p className="text-xs text-gray-300 mt-1">{msg.fileName}</p>
                                        )}
                                    </div>
                                ) : msg.type === "file" ? (
                                    <div className="my-1">
                                        <div
                                            className="flex items-center gap-3 p-3 bg-[#1e2a30] rounded-lg border border-[#374248] hover:bg-[#25313a] transition-colors cursor-pointer group"
                                            onClick={() => handleDocumentClick(msg.message)}
                                            title="Click to open document"
                                        >
                                            <div className="flex-shrink-0">
                                                {getFileIcon(msg.fileName, msg.format)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {msg.fileName || 'Document'}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {getFileTypeName(msg.fileName, msg.format)}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 flex gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownload(msg.message, msg.fileName);
                                                    }}
                                                    className="p-2 text-gray-300 hover:text-white hover:bg-[#00a884] rounded-full transition-colors"
                                                    title="Download file"
                                                >
                                                    <FaDownload size={16} />
                                                </button>
                                                <div className="p-2 text-gray-400 group-hover:text-[#00a884] transition-colors">
                                                    <FaExternalLinkAlt size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-white text-left whitespace-pre-wrap wrap-break-words">
                                        {msg.message}
                                    </p>
                                )}

                                <p className={`text-xs mt-2 text-right ${msg.username === username ? 'text-[#89b4a5]' : 'text-gray-400'
                                    }`}>
                                    {msg.time}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center mt-20">
                            <div className="w-20 h-20 bg-[#2a3942] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">👋</span>
                            </div>
                            <h3 className="text-lg font-light text-gray-300 mb-2">
                                {activeChatType === 'group' ? 'Group created!' : 'Say hello!'}
                            </h3>
                            <p className="text-gray-400">
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

            {/* Input Area */}
            <div className="p-3 bg-[#202c33] border-t border-[#374248]">
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <button
                        onClick={handlePaperClipClick}
                        disabled={!activeUser || uploading}
                        className={`p-3 rounded-full transition-all ${!activeUser || uploading
                            ? "text-gray-500 cursor-not-allowed"
                            : "text-gray-300 hover:text-white hover:bg-[#374248]"
                            }`}
                        title="Upload file"
                    >
                        <GoPaperclip size={20} />
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={
                                activeUser 
                                    ? activeChatType === 'group' 
                                        ? `Message group...` 
                                        : `Message ${activeUser}...`
                                    : "Select a user to start chatting"
                            }
                            className="w-full p-3 px-4 rounded-lg bg-[#2a3942] text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00a884] border-none"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") sendMessage(e);
                            }}
                            disabled={!activeUser || uploading}
                        />
                    </div>

                    <button
                        onClick={sendMessage}
                        disabled={!activeUser || uploading || !message.trim()}
                        className={`p-3 rounded-full transition-all ${!activeUser || uploading || !message.trim()
                            ? "text-gray-500 cursor-not-allowed bg-[#2a3942]"
                            : "text-white bg-[#00a884] hover:bg-[#00b884]"
                            }`}
                    >
                        <FaPaperPlane size={16} />
                    </button>
                </div>
            </div>
        </>
    );
}