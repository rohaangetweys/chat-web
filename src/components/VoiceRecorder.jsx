"use client";

import { useEffect, useState, useRef } from "react";

export default function VoiceRecorder({ onRecordingComplete, onClose }) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingComplete, setRecordingComplete] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [duration, setDuration] = useState(0);

    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const durationIntervalRef = useRef(null);

    const startRecording = async () => {
        setIsRecording(true);
        setRecordingComplete(false);
        setTranscript("");
        setDuration(0);
        audioChunksRef.current = [];

        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);

        // 🎙️ SpeechRecognition setup
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = "en-US";

            recognitionRef.current.onresult = (event) => {
                const { transcript: newTranscript } = event.results[event.results.length - 1][0];
                setTranscript(newTranscript);
            };

            recognitionRef.current.start();
        }

        // ✅ iOS-safe mediaDevices fallback
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

        // 🎧 Audio recording setup
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                setRecordingComplete(true);

                // Stop all tracks
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
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
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
            onRecordingComplete(audioBlob, transcript, duration);
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
            if (recognitionRef.current) recognitionRef.current.stop();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#2a3942] rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Voice Message</h3>
                    <button
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="bg-[#202c33] rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-medium text-white">
                            {recordingComplete ? "Recording complete" : isRecording ? "Recording..." : "Ready to record"}
                        </p>
                        {isRecording && (
                            <div className="flex items-center gap-2">
                                <div className="rounded-full w-3 h-3 bg-red-400 animate-pulse" />
                                <span className="text-sm text-red-400 font-medium">{formatTime(duration)}</span>
                            </div>
                        )}
                    </div>

                    {transcript && (
                        <div className="border border-[#374248] rounded-md p-3 bg-[#1e2a30]">
                            <p className="text-sm text-gray-300">{transcript}</p>
                        </div>
                    )}

                    {recordingComplete && (
                        <div className="mt-3">
                            <audio controls className="w-full">
                                <source src={URL.createObjectURL(new Blob(audioChunksRef.current, { type: "audio/webm" }))} type="audio/webm" />
                            </audio>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    {!isRecording && !recordingComplete ? (
                        <button
                            onClick={startRecording}
                            className="w-full py-3 bg-[#00a884] text-white rounded-lg hover:bg-[#00b884] transition-colors font-medium flex items-center justify-center gap-2"
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
                            className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
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
                                className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                            >
                                Record Again
                            </button>
                            <button
                                onClick={handleSendRecording}
                                className="flex-1 py-3 bg-[#00a884] text-white rounded-lg hover:bg-[#00b884] transition-colors font-medium"
                            >
                                Send Voice Message
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleCancel}
                        className="w-full py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}