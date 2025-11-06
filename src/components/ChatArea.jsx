'use client'
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaPaperPlane, FaFilePdf, FaFileWord, FaFileArchive, FaFile, FaDownload, FaPlay, FaExternalLinkAlt, FaMicrophone, FaPause } from 'react-icons/fa';
import { GoPaperclip } from 'react-icons/go';

export default function ChatArea({ activeUser, chat, username, uploading, fileInputRef, onOpenMedia, activeChatType, onShowVoiceRecorder, onPaperClipClick, onSendMessage, userProfiles }) {
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef(null);
    const [playingAudio, setPlayingAudio] = useState(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!message.trim() || !activeUser || !username) return;

        try {
            await onSendMessage(message.trim());
            setMessage("");
        } catch (err) {
            console.error("sendMessage error:", err);
            toast.error("Failed to send message");
        }
    };

    const handleVoiceRecordClick = () => {
        if (!activeUser) {
            toast.error('Please select a user to chat with');
            return;
        }
        onShowVoiceRecorder();
    };

    const getFileIcon = (fileName, format) => {
        const fileExt = fileName?.split('.').pop()?.toLowerCase() || format?.toLowerCase();
        if (fileExt === 'pdf') return <FaFilePdf className="text-red-500" size={24} />;
        if (['doc', 'docx'].includes(fileExt)) return <FaFileWord className="text-blue-500" size={24} />;
        if (['zip', 'rar', '7z'].includes(fileExt)) return <FaFileArchive className="text-yellow-500" size={24} />;
        if (['txt'].includes(fileExt)) return <FaFile className="text-gray-400" size={24} />;
        return <FaFile className="text-gray-500" size={24} />;
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
            webm: 'Voice Message',
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

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getProfilePhoto = (username) => {
        return userProfiles[username]?.profilePhoto || null;
    };

    const VoiceMessagePlayer = ({ msg, index }) => {
        const audioRef = useRef(null);
        const [isPlaying, setIsPlaying] = useState(false);
        const [progress, setProgress] = useState(0);
        const [currentTime, setCurrentTime] = useState(0);

        const formatDuration = (seconds) => {
            if (!seconds && seconds !== 0) return '0:00';

            const totalSeconds = Math.round(seconds);
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        const togglePlayPause = async () => {
            if (!audioRef.current) return;

            try {
                if (isPlaying) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                } else {
                    const allAudioElements = document.querySelectorAll('audio');
                    allAudioElements.forEach(audio => {
                        if (audio !== audioRef.current) {
                            audio.pause();
                            audio.currentTime = 0;
                            const event = new Event('pause');
                            audio.dispatchEvent(event);
                        }
                    });

                    await audioRef.current.play();
                    setIsPlaying(true);
                }
            } catch (error) {
                console.error('Error playing audio:', error);
                toast.error('Error playing voice message');
            }
        };

        const handleTimeUpdate = () => {
            if (audioRef.current && audioRef.current.duration) {
                const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
                setProgress(isNaN(progress) ? 0 : progress);
                setCurrentTime(audioRef.current.currentTime);
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
        };

        const handleLoadedMetadata = () => {
            if (audioRef.current) {
                setCurrentTime(0);
            }
        };

        const handleSeek = (e) => {
            if (!audioRef.current || !audioRef.current.duration) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const seekTime = percent * audioRef.current.duration;

            audioRef.current.currentTime = seekTime;
            setProgress(percent * 100);
        };

        const handleCanPlay = () => {
            console.log('Audio can play');
        };

        const handleError = (e) => {
            console.error('Audio error:', e);
            toast.error('Error loading voice message');
        };

        const isOwnMessage = msg.username === username;

        return (
            <div className="my-1 w-full max-w-xs md:max-w-sm lg:max-w-md">
                <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isOwnMessage
                        ? 'bg-[#00a884] border-[#00a884]'
                        : 'bg-white border-gray-200'
                    }`}>
                    {/* Play/Pause Button */}
                    <button
                        onClick={togglePlayPause}
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOwnMessage
                                ? 'bg-white text-[#00a884] hover:bg-gray-100'
                                : 'bg-[#00a884] text-white hover:bg-[#00b884]'
                            }`}
                    >
                        {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} className="ml-0.5" />}
                    </button>

                    {/* Progress Bar */}
                    <div className="flex-1 min-w-0">
                        <div
                            className="relative h-1 bg-gray-300 rounded-full cursor-pointer mb-1"
                            onClick={handleSeek}
                        >
                            <div
                                className={`absolute h-full rounded-full transition-all ${isOwnMessage ? 'bg-white' : 'bg-[#00a884]'
                                    }`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <span className={`text-xs ${isOwnMessage ? 'text-white' : 'text-gray-600'
                                }`}>
                                {formatDuration(currentTime)}
                            </span>
                            <span className={`text-xs ${isOwnMessage ? 'text-white' : 'text-gray-500'
                                }`}>
                                {formatDuration(msg.duration)}
                            </span>
                        </div>
                    </div>

                    {/* Hidden Audio Element */}
                    <audio
                        ref={audioRef}
                        src={msg.message}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleEnded}
                        onLoadedMetadata={handleLoadedMetadata}
                        onCanPlay={handleCanPlay}
                        onError={handleError}
                        preload="metadata"
                    />
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-100 relative">
                <div className="flex flex-col space-y-2 mx-auto">
                    {!activeUser ? (
                        <div className="text-center mt-20">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <span className="text-4xl text-gray-400">💬</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to Chat</h3>
                            <p className="text-gray-500">Select a contact from the sidebar to start a conversation</p>
                        </div>
                    ) : chat.length > 0 ? (
                        chat.map((msg, i) => {
                            const isOwnMessage = msg.username === username;
                            const profilePhoto = getProfilePhoto(msg.username);

                            return (
                                <div
                                    key={msg.id || i}
                                    className={`max-w-[85%] md:max-w-[70%] break-all h-auto min-w-[15%] p-3 rounded-2xl shadow-sm ${isOwnMessage
                                        ? "ml-auto bg-[#00a884] text-white"
                                        : "mr-auto bg-white text-gray-800 border border-gray-200"
                                        }`}
                                >
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
                                                <div className="w-6 h-6 rounded-full bg-[#00a884] flex items-center justify-center text-white text-xs font-semibold">
                                                    {msg.username.slice(0, 1).toUpperCase()}
                                                </div>
                                            )}
                                            <p className="text-xs text-[#00a884] font-medium">
                                                {msg.username}
                                            </p>
                                        </div>
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
                                                    className="rounded-2xl max-w-full h-auto object-cover transition-transform group-hover:scale-105 border border-gray-200"
                                                    style={{ maxHeight: '300px' }}
                                                />
                                            </div>
                                            {msg.fileName && (
                                                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-gray-200' : 'text-gray-500'}`}>
                                                    {msg.fileName}
                                                </p>
                                            )}
                                        </div>
                                    ) : msg.type === "video" ? (
                                        <div className="my-1">
                                            <div
                                                className="relative cursor-pointer group"
                                                onClick={() => onOpenMedia(msg.message, 'video')}
                                            >
                                                <video
                                                    className="rounded-2xl max-w-full h-auto border border-gray-200"
                                                    style={{ maxHeight: '400px' }}
                                                    controls
                                                >
                                                    <source src={msg.message} type="video/mp4" />
                                                </video>
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-2xl flex items-center justify-center">
                                                    <div className="group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-full p-3">
                                                        <FaPlay className="text-white" size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                            {msg.fileName && (
                                                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-gray-200' : 'text-gray-500'}`}>
                                                    {msg.fileName}
                                                </p>
                                            )}
                                        </div>
                                    ) : msg.type === "audio" ? (
                                        <VoiceMessagePlayer msg={msg} index={i} />
                                    ) : msg.type === "file" ? (
                                        <div className="my-1">
                                            <div
                                                className="flex items-center gap-3 p-3 bg-gray-100 rounded-2xl border border-gray-300 hover:bg-gray-200 transition-colors cursor-pointer group"
                                                onClick={() => handleDocumentClick(msg.message)}
                                                title="Click to open document"
                                            >
                                                <div className="shrink-0">
                                                    {getFileIcon(msg.fileName, msg.format)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}>
                                                        {msg.fileName || 'Document'}
                                                    </p>
                                                    <p className={`text-xs ${isOwnMessage ? 'text-gray-200' : 'text-gray-600'}`}>
                                                        {getFileTypeName(msg.fileName, msg.format)}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 flex gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownload(msg.message, msg.fileName);
                                                        }}
                                                        className={`p-2 rounded-full transition-colors ${isOwnMessage
                                                            ? 'text-gray-200 hover:text-white hover:bg-[#008f70]'
                                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-300'
                                                            }`}
                                                        title="Download file"
                                                    >
                                                        <FaDownload size={16} />
                                                    </button>
                                                    <div className={`p-2 transition-colors ${isOwnMessage
                                                        ? 'text-gray-200 group-hover:text-white'
                                                        : 'text-gray-400 group-hover:text-[#00a884]'
                                                        }`}>
                                                        <FaExternalLinkAlt size={14} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className={`text-left whitespace-pre-wrap wrap-break-words ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}>
                                            {msg.message}
                                        </p>
                                    )}

                                    <p className={`text-xs mt-2 text-right ${isOwnMessage ? 'text-gray-200' : 'text-gray-500'
                                        }`}>
                                        {msg.time}
                                    </p>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center mt-20">
                            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <span className="text-2xl text-gray-400">👋</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                {activeChatType === 'group' ? 'Group created!' : 'Say hello!'}
                            </h3>
                            <p className="text-gray-500">
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
            <div className="p-4 bg-white border-t border-gray-200 shadow-sm flex items-center">
                <div className="flex items-center gap-2 w-full">
                    <button
                        onClick={onPaperClipClick}
                        disabled={!activeUser || uploading}
                        className={`p-3 rounded-full transition-all ${!activeUser || uploading
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-600 hover:text-[#00a884] hover:bg-gray-100"
                            }`}
                        title="Upload file"
                    >
                        <GoPaperclip size={20} />
                    </button>

                    <button
                        onClick={handleVoiceRecordClick}
                        disabled={!activeUser || uploading}
                        className={`p-3 rounded-full transition-all ${!activeUser || uploading
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-600 hover:text-[#00a884] hover:bg-gray-100"
                            }`}
                        title="Record voice message"
                    >
                        <FaMicrophone size={18} />
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
                                    : "Select a contact to start chatting"
                            }
                            className="w-full p-3 px-4 rounded-full bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] border-none shadow-inner"
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
                            ? "text-gray-400 cursor-not-allowed bg-gray-100"
                            : "text-white bg-[#00a884] hover:bg-[#00b884] shadow-md"
                            }`}
                    >
                        <FaPaperPlane size={16} />
                    </button>
                </div>
            </div>
        </>
    );
}