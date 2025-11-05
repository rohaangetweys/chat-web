"use client";

import { useEffect, useState, useRef } from "react";

export default function MicrophoneComponent() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioURL, setAudioURL] = useState(null);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    setIsRecording(true);
    setTranscript("");
    setAudioURL(null);

    // 🎙️ SpeechRecognition setup
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const { transcript } = event.results[event.results.length - 1][0];
        setTranscript(transcript);
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
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        setRecordingComplete(true);
      };

      mediaRecorderRef.current.start();
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Microphone access is blocked or unsupported on this device.");
      setIsRecording(false);
    }
  };


  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleToggleRecording = () => {
    if (!isRecording) startRecording();
    else stopRecording();
  };

  return (
    <div className="flex items-center justify-center h-screen w-full bg-gray-100">
      <div className="w-full max-w-md text-center">
        {(isRecording || transcript || audioURL) && (
          <div className="m-auto rounded-md border p-4 bg-white shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">
                  {recordingComplete ? "Recording complete" : "Listening..."}
                </p>
                <p className="text-xs text-gray-500">
                  {recordingComplete
                    ? "You can play your recording below."
                    : "Speak clearly into your microphone."}
                </p>
              </div>
              {isRecording && (
                <div className="rounded-full w-4 h-4 bg-red-400 animate-pulse" />
              )}
            </div>

            {transcript && (
              <div className="border rounded-md p-2 mt-4 text-left">
                <p className="text-sm">{transcript}</p>
              </div>
            )}

            {audioURL && (
              <div className="mt-4">
                <audio controls src={audioURL} className="w-full" />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-center">
          {isRecording ? (
            <button
              onClick={handleToggleRecording}
              className="mt-10 bg-red-400 hover:bg-red-500 rounded-full w-20 h-20 flex items-center justify-center focus:outline-none"
            >
              <svg
                className="h-12 w-12"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path fill="white" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleToggleRecording}
              className="mt-10 bg-blue-400 hover:bg-blue-500 rounded-full w-20 h-20 flex items-center justify-center focus:outline-none"
            >
              <svg
                viewBox="0 0 256 256"
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 text-white"
              >
                <path
                  fill="currentColor"
                  d="M128 176a48.05 48.05 0 0 0 48-48V64a48 48 0 0 0-96 0v64a48.05 48.05 0 0 0 48 48ZM96 64a32 32 0 0 1 64 0v64a32 32 0 0 1-64 0Zm40 143.6V232a8 8 0 0 1-16 0v-24.4A80.11 80.11 0 0 1 48 128a8 8 0 0 1 16 0a64 64 0 0 0 128 0a8 8 0 0 1 16 0a80.11 80.11 0 0 1-72 79.6Z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
