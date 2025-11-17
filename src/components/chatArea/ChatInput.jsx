'use client';
import { useTheme } from '@/contexts/ThemeContext';
import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaMicrophone, FaStop, FaTimes, FaImage, FaVideo, FaFile } from 'react-icons/fa';
import { GoPaperclip } from 'react-icons/go';

export default function ChatInput({ activeUser, uploading, fileInputRef, onPaperClipClick, onStartRecording, onStopRecording, onCancelRecording, onSendRecording, isRecording, recordingComplete, duration, audioBlob, onSendMessage, message, setMessage, onKeyDown, activeChatType, onFileTypeSelect }) {
    const { isDark } = useTheme();
    const [showFileDropdown, setShowFileDropdown] = useState(false);
    const dropdownRef = useRef(null);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowFileDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePaperClipClick = (e) => {
        e.preventDefault();
        setShowFileDropdown(!showFileDropdown);
    };

    const handleFileTypeSelect = (fileType) => {
        setShowFileDropdown(false);
        const acceptMap = {
            image: 'image/*',
            video: 'video/*',
            document: '.pdf,.doc,.docx,.txt,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        if (fileInputRef.current) {
            fileInputRef.current.accept = acceptMap[fileType] || '*/*';
            fileInputRef.current.click();
        }

        if (onFileTypeSelect) {
            onFileTypeSelect(fileType);
        }
    };

    const fileOptions = [
        {
            type: 'image',
            label: 'Photos & Images',
            icon: FaImage,
            description: 'Upload photos and images',
            color: 'text-green-500'
        },
        {
            type: 'video',
            label: 'Videos',
            icon: FaVideo,
            description: 'Upload video files',
            color: 'text-blue-500'
        },
        {
            type: 'document',
            label: 'Documents',
            icon: FaFile,
            description: 'PDF, Word, and other files',
            color: 'text-purple-500'
        }
    ];

    if (isRecording || recordingComplete) {
        return (
            <div className={`p-3 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border-t`}>
                <div className="flex items-center justify-between w-full">
                    <button
                        onClick={onCancelRecording}
                        className={`p-2 rounded-full transition-all ${isDark
                            ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                            : 'text-gray-600 hover:text-red-500 hover:bg-gray-100'
                            }`}
                    >
                        <FaTimes size={16} />
                    </button>

                    <div className="flex-1 flex flex-col items-center mx-3">
                        {isRecording ? (
                            <>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className={`text-md font-semibold ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                                        {formatTime(duration)}
                                    </span>
                                </div>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Recording... Tap to stop
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-md font-semibold ${isDark ? 'text-green-400' : 'text-green-500'}`}>
                                        {formatTime(duration)}
                                    </span>
                                </div>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Tap to send
                                </p>
                            </>
                        )}
                    </div>

                    {isRecording ? (
                        <button
                            onClick={onStopRecording}
                            className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                            <FaStop size={14} />
                        </button>
                    ) : (
                        <button
                            onClick={onSendRecording}
                            className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                        >
                            <FaPaperPlane size={12} />
                        </button>
                    )}
                </div>

                {recordingComplete && audioBlob && (
                    <div className="mt-3 flex justify-center">
                        <audio
                            controls
                            className={`w-full max-w-xs rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'
                                }`}
                        >
                            <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`p-3 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border-t flex items-center`}>
            <div className="flex items-center gap-1 w-full">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={handlePaperClipClick}
                        disabled={!activeUser || uploading}
                        className={`cursor-pointer p-2 rounded-full transition-all ${!activeUser || uploading
                            ? 'text-gray-400 cursor-not-allowed'
                            : isDark
                                ? `text-gray-400 hover:text-[#0084ff] hover:bg-gray-700 ${showFileDropdown ? 'bg-gray-700 text-[#0084ff]' : ''}`
                                : `text-gray-600 hover:text-[#0084ff] hover:bg-gray-100 ${showFileDropdown ? 'bg-gray-100 text-[#0084ff]' : ''}`
                            }`}
                        title="Upload file"
                    >
                        <GoPaperclip size={16} />
                    </button>

                    {showFileDropdown && (
                        <div className={`absolute bottom-full left-0 mb-1 w-56 rounded-lg shadow-lg z-50 ${isDark ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'
                            }`}>
                            <div className={`p-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'
                                }`}>
                                <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                    Choose File Type
                                </h3>
                            </div>

                            <div className="p-1 space-y-0.5">
                                {fileOptions.map((option) => {
                                    const IconComponent = option.icon;
                                    return (
                                        <button
                                            key={option.type}
                                            onClick={() => handleFileTypeSelect(option.type)}
                                            className={`cursor-pointer w-full flex items-center gap-2 p-2 rounded-md transition-colors text-left ${isDark
                                                ? 'hover:bg-gray-700 text-gray-200'
                                                : 'hover:bg-gray-50 text-gray-700'
                                                }`}
                                        >
                                            <div className={`p-1.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-100'
                                                }`}>
                                                <IconComponent className={`${option.color}`} size={14} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-xs">{option.label}</p>
                                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'
                                                    }`}>
                                                    {option.description}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className={`p-1 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'
                                }`}>
                                <button
                                    onClick={() => setShowFileDropdown(false)}
                                    className={`w-full py-1.5 px-3 rounded-md text-xs font-medium ${isDark
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        } transition-colors`}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={onStartRecording}
                    disabled={!activeUser || uploading}
                    className={`cursor-pointer p-2 rounded-full transition-all ${!activeUser || uploading
                        ? 'text-gray-400 cursor-not-allowed'
                        : isDark
                            ? 'text-gray-400 hover:text-[#0084ff] hover:bg-gray-700'
                            : 'text-gray-600 hover:text-[#0084ff] hover:bg-gray-100'
                        }`}
                    title="Record voice message"
                >
                    <FaMicrophone size={14} />
                </button>

                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                            activeUser
                                ? (activeChatType === 'group'
                                    ? `Message group...`
                                    : `Message ${activeUser}...`
                                )
                                : 'Select a contact to start chatting'
                        }
                        className={`w-full p-2 px-3 text-sm rounded-full ${isDark
                            ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-[#0084ff]'
                            : 'bg-gray-100 text-gray-800 placeholder-gray-500 focus:ring-[#0084ff]'
                            } focus:outline-none focus:ring-1 border-none`}
                        onKeyDown={onKeyDown}
                        disabled={!activeUser || uploading}
                    />
                </div>

                <button
                    onClick={onSendMessage}
                    disabled={!activeUser || uploading || !message.trim()}
                    className={`cursor-pointer p-2 rounded-full transition-all ${!activeUser || uploading || !message.trim()
                        ? isDark
                            ? 'text-gray-600 cursor-not-allowed bg-gray-700'
                            : 'text-gray-400 cursor-not-allowed bg-gray-100'
                        : 'text-white bg-[#0084ff] hover:bg-[#0084ff]'
                        }`}
                >
                    <FaPaperPlane size={12} />
                </button>
            </div>
        </div>
    );
}