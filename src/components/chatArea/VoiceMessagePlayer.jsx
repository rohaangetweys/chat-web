'use client';
import React, { useRef, useState } from 'react';
import { FaPlay, FaPause, FaMicrophone } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function VoiceMessagePlayer({ msg, index, username }) {
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
            const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(isNaN(p) ? 0 : p);
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) setCurrentTime(0);
    };

    const handleSeek = (e) => {
        if (!audioRef.current || !audioRef.current.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const seekTime = percent * audioRef.current.duration;
        audioRef.current.currentTime = seekTime;
        setProgress(percent * 100);
    };

    return (
        <div className="my-1 w-full max-w-xs md:max-w-sm lg:max-w-md">
            <div
                className={`flex items-center gap-3 p-3 rounded-3xl shadow-sm ${
                    msg.username === username
                        ? 'bg-[#0084ff] text-white'
                        : 'bg-[#f1f0f0] text-gray-800'
                }`}
            >
                {/* Microphone Icon */}
                <div className="w-10 h-10 bg-white flex items-center justify-center rounded-xl shadow-sm">
                    <FaMicrophone className="text-[#0084ff]" size={18} />
                </div>

                {/* Play / Pause + Progress */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={togglePlayPause}
                            className={`shrink-0 w-6 h-6 flex items-center justify-center text-[#0084ff]`}
                        >
                            {isPlaying ? <FaPause size={10} /> : <FaPlay size={10} className="ml-0.5" />}
                        </button>

                        <div
                            className="relative w-full h-1 bg-gray-300 rounded-full cursor-pointer"
                            onClick={handleSeek}
                        >
                            <div
                                className="absolute h-full bg-[#0084ff] rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <span className="text-[11px] text-gray-500 mt-1">
                        {formatDuration(currentTime)} / {formatDuration(msg.duration)}
                    </span>
                </div>

                <audio
                    ref={audioRef}
                    src={msg.message}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                    onLoadedMetadata={handleLoadedMetadata}
                    preload="metadata"
                />
            </div>
        </div>
    );
}
