"use client";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState, useRef } from "react";

export default function VoiceRecorder({ onRecordingComplete, onClose }) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingComplete, setRecordingComplete] = useState(false);
    const [duration, setDuration] = useState(0);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const durationIntervalRef = useRef(null);

    const { isDark } = useTheme();

    const startRecording = async () => {
        setIsRecording(true);
        setRecordingComplete(false);
        setDuration(0);
        audioChunksRef.current = [];

        durationIntervalRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);

        if (typeof navigator.mediaDevices === "undefined") {
            navigator.mediaDevices = {};
        }

        if (typeof navigator.mediaDevices.getUserMedia === "undefined") {
            navigator.mediaDevices.getUserMedia = function (constraints) {
                const getUserMedia =
                    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

                if (!getUserMedia) {
                    alert(
                        "Your browser does not support audio recording. Try using Safari or Chrome (latest version) on HTTPS."
                    );
                    return Promise.reject(
                        new Error("getUserMedia is not implemented in this browser")
                    );
                }

                return new Promise((resolve, reject) =>
                    getUserMedia.call(navigator, constraints, resolve, reject)
                );
            };
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                setRecordingComplete(true);

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
        } catch (err) {
            console.error("Microphone access error:", err);
            alert("Microphone access is blocked or unsupported on this device.");
            setIsRecording(false);
            clearInterval(durationIntervalRef.current);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
        }
        setIsRecording(false);
    };

    const handleSendRecording = () => {
        if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            onRecordingComplete(audioBlob, duration);
        }
    };

    const handleCancel = () => {
        stopRecording();
        onClose();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black/85 bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-sm mx-auto shadow-2xl`}>
                <div className="flex justify-between items-center mb-5">
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Voice Message</h3>
                    <button
                        onClick={handleCancel}
                        className={`${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'} transition-colors p-1 rounded-full`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'} rounded-lg p-4 mb-6 border`}>
                    <div className="flex justify-between items-center mb-3">
                        <p className={`text-sm font-medium ${isRecording ? 'text-[#0084ff]' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {recordingComplete ? "Recording complete" : isRecording ? "Recording..." : "Ready to record"}
                        </p>
                        {isRecording && (
                            <div className="flex items-center gap-2">
                                <div className="rounded-full w-3 h-3 bg-red-500 animate-pulse" />
                                <span className="text-sm text-red-500 font-medium">{formatTime(duration)}</span>
                            </div>
                        )}
                    </div>

                    {recordingComplete && (
                        <div className="mt-4">
                            <audio controls className="w-full rounded-lg">
                                <source src={URL.createObjectURL(new Blob(audioChunksRef.current, { type: "audio/webm" }))} type="audio/webm" />
                            </audio>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    {!isRecording && !recordingComplete ? (
                        <button
                            onClick={startRecording}
                            className="w-full py-3 bg-[#0084ff] text-white rounded-lg hover:bg-[#0084ff] transition-colors font-medium flex items-center justify-center gap-2 shadow-md"
                        >
                            <svg
                                viewBox="0 0 256 256"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5"
                            >
                                <path
                                    fill="currentColor"
                                    d="M128 176a48.05 48.05 0 0 0 48-48V64a48 48 0 0 0-96 0v64a48.05 48.05 0 0 0 48 48ZM96 64a32 32 0 0 1 64 0v64a32 32 0 0 1-64 0Zm40 143.6V232a8 8 0 0 1-16 0v-24.4A80.11 80.11 0 0 1 48 128a8 8 0 0 1 16 0a64 64 0 0 0 128 0a8 8 0 0 1 16 0a80.11 80.11 0 0 1-72 79.6Z"
                                />
                            </svg>
                            Start Recording
                        </button>
                    ) : isRecording ? (
                        <button
                            onClick={stopRecording}
                            className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2 shadow-md"
                        >
                            <svg
                                className="w-5 h-5"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path fill="white" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                            Stop Recording
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={startRecording}
                                className={`flex-1 py-3 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300'} rounded-lg transition-colors font-medium border`}
                            >
                                Record Again
                            </button>
                            <button
                                onClick={handleSendRecording}
                                className="flex-1 py-3 bg-[#0084ff] text-white rounded-lg hover:bg-[#0084ff] transition-colors font-medium shadow-md"
                            >
                                Send Voice Message
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleCancel}
                        className={`w-full py-2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium`}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}