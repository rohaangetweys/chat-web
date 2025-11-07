import React, { useRef, useState } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';
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
            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${msg.username === username ? 'bg-[#00a884] border-[#00a884]' : 'bg-white border-gray-200'}`}>
                <button onClick={togglePlayPause} className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${msg.username === username ? 'bg-white text-[#00a884] hover:bg-gray-100' : 'bg-[#00a884] text-white hover:bg-[#00b884]'}`}>
                    {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} className="ml-0.5" />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="relative h-1 bg-gray-300 rounded-full cursor-pointer mb-1" onClick={handleSeek}>
                        <div className={`absolute h-full rounded-full transition-all ${msg.username === username ? 'bg-white' : 'bg-[#00a884]'}`} style={{ width: `${progress}%` }} />
                    </div>

                    <div className="flex justify-between items-center">
                        <span className={`text-xs ${msg.username === username ? 'text-white' : 'text-gray-600'}`}>{formatDuration(currentTime)}</span>
                        <span className={`text-xs ${msg.username === username ? 'text-white' : 'text-gray-500'}`}>{formatDuration(msg.duration)}</span>
                    </div>
                </div>

                <audio ref={audioRef} src={msg.message} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} onLoadedMetadata={handleLoadedMetadata} preload="metadata" />
            </div>
        </div>
    );
}