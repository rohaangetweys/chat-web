'use client'
import { db } from '@/lib/firebase';
import { push, ref } from 'firebase/database';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast';
import { FaPaperPlane } from 'react-icons/fa';
import { GoPaperclip } from 'react-icons/go';

export default function ChatArea({ activeUser, chat, username, uploading, fileInputRef }) {
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);


    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!message.trim() || !activeUser || !username) return;

        const chatId =
            username < activeUser
                ? `${username}_${activeUser}`
                : `${activeUser}_${username}`;

        const chatRef = ref(db, `chats/${chatId}`);
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

    return (
        <>
            {/* Messages Area */}
            <div
                className="flex-1 p-4 overflow-y-auto bg-cover bg-center"
            >
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
                                {msg.username !== username && (
                                    <p className="text-xs text-[#00a884] font-medium mb-1">
                                        {msg.username}
                                    </p>
                                )}

                                {msg.type === "image" ? (
                                    <div className="my-1">
                                        <Image
                                            src={msg.message}
                                            alt="Uploaded image"
                                            width={300}
                                            height={200}
                                            className="rounded-lg max-w-full h-auto object-cover"
                                            style={{ maxHeight: '300px' }}
                                        />
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
                            <h3 className="text-lg font-light text-gray-300 mb-2">Say hello!</h3>
                            <p className="text-gray-400">Send your first message to start the conversation</p>
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
                        title="Upload image"
                    >
                        <GoPaperclip size={20} />
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={
                                activeUser ? `Message ${activeUser}...` : "Select a user to start chatting"
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
    )
}
