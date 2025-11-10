'use client';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { FaPaperPlane, FaMicrophone, FaStop, FaTimes } from 'react-icons/fa';
import { GoPaperclip } from 'react-icons/go';

export default function ChatInput({ 
    activeUser, 
    uploading, 
    fileInputRef, 
    onPaperClipClick, 
    onStartRecording,
    onStopRecording,
    onCancelRecording,
    onSendRecording,
    isRecording,
    recordingComplete,
    duration,
    audioBlob,
    onSendMessage, 
    message, 
    setMessage, 
    onKeyDown, 
    activeChatType 
}) {
    const { isDark } = useTheme();

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Show voice recorder UI when recording or when recording is complete
    if (isRecording || recordingComplete) {
        return (
            <div className={`p-4 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border-t shadow-sm`}>
                <div className="flex items-center justify-between w-full">
                    {/* Cancel Button */}
                    <button 
                        onClick={onCancelRecording}
                        className={`p-3 rounded-full transition-all ${
                            isDark 
                                ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' 
                                : 'text-gray-600 hover:text-red-500 hover:bg-gray-100'
                        }`}
                    >
                        <FaTimes size={20} />
                    </button>

                    {/* Recording Info */}
                    <div className="flex-1 flex flex-col items-center mx-4">
                        {isRecording ? (
                            <>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className={`text-lg font-semibold ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                                        {formatTime(duration)}
                                    </span>
                                </div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Recording... Tap to stop
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`text-lg font-semibold ${isDark ? 'text-green-400' : 'text-green-500'}`}>
                                        {formatTime(duration)}
                                    </span>
                                </div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Tap to send
                                </p>
                            </>
                        )}
                    </div>

                    {/* Action Button */}
                    {isRecording ? (
                        <button
                            onClick={onStopRecording}
                            className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        >
                            <FaStop size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={onSendRecording}
                            className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-lg"
                        >
                            <FaPaperPlane size={16} />
                        </button>
                    )}
                </div>

                {/* Audio Preview */}
                {recordingComplete && audioBlob && (
                    <div className="mt-4 flex justify-center">
                        <audio 
                            controls 
                            className={`w-full max-w-md rounded-lg ${
                                isDark ? 'bg-gray-700' : 'bg-gray-100'
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

    // Normal chat input UI
    return (
        <div className={`p-4 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border-t shadow-sm flex items-center`}>
            <div className="flex items-center gap-2 w-full">
                <button 
                    onClick={onPaperClipClick} 
                    disabled={!activeUser || uploading} 
                    className={`p-3 rounded-full transition-all ${
                        !activeUser || uploading 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : isDark 
                                ? 'text-gray-400 hover:text-[#0084ff] hover:bg-gray-700' 
                                : 'text-gray-600 hover:text-[#0084ff] hover:bg-gray-100'
                    }`} 
                    title="Upload file"
                >
                    <GoPaperclip size={20} />
                </button>

                <button 
                    onClick={onStartRecording}
                    disabled={!activeUser || uploading} 
                    className={`p-3 rounded-full transition-all ${
                        !activeUser || uploading 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : isDark 
                                ? 'text-gray-400 hover:text-[#0084ff] hover:bg-gray-700' 
                                : 'text-gray-600 hover:text-[#0084ff] hover:bg-gray-100'
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
                                ? (activeChatType === 'group' 
                                    ? `Message group...` 
                                    : `Message ${activeUser}...`
                                  )
                                : 'Select a contact to start chatting'
                        } 
                        className={`w-full p-3 px-4 rounded-full ${
                            isDark 
                                ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-[#0084ff]' 
                                : 'bg-gray-100 text-gray-800 placeholder-gray-500 focus:ring-[#0084ff]'
                        } focus:outline-none focus:ring-2 border-none shadow-inner`} 
                        onKeyDown={onKeyDown} 
                        disabled={!activeUser || uploading} 
                    />
                </div>

                <button 
                    onClick={onSendMessage} 
                    disabled={!activeUser || uploading || !message.trim()} 
                    className={`p-3 rounded-full transition-all ${
                        !activeUser || uploading || !message.trim() 
                            ? isDark 
                                ? 'text-gray-600 cursor-not-allowed bg-gray-700' 
                                : 'text-gray-400 cursor-not-allowed bg-gray-100'
                            : 'text-white bg-[#0084ff] hover:bg-[#00b884] shadow-md'
                    }`}
                >
                    <FaPaperPlane size={16} />
                </button>
            </div>
        </div>
    );
}