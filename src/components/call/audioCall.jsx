'use client';
import { useEffect, useRef, useState } from 'react';
import { ref, remove, set, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebaseConfig';
import { useTheme } from '@/contexts/ThemeContext';
import { FaPhone, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

export default function AudioCall({ callState, onCallEnd, onCallAccept, onCallReject, username, userProfiles }) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [peerConnection, setPeerConnection] = useState(null);

    const localAudioRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const durationIntervalRef = useRef(null);
    const { isDark } = useTheme();

    // WebRTC configuration (using free STUN servers)
    const pcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    useEffect(() => {
        if (callState.isActiveCall) {
            initializeCall();
            startCallTimer();
        }

        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerConnection) {
                peerConnection.close();
            }
        };
    }, [callState.isActiveCall]);

    const initializeCall = async () => {
        try {
            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            setLocalStream(stream);

            if (localAudioRef.current) {
                localAudioRef.current.srcObject = stream;
            }

            // Create peer connection
            const pc = new RTCPeerConnection(pcConfig);
            setPeerConnection(pc);

            // Add local tracks
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Handle remote stream
            pc.ontrack = (event) => {
                const remoteStream = event.streams[0];
                setRemoteStream(remoteStream);
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStream;
                }
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    // Send ICE candidate to the other peer via Firebase
                    // This would be implemented in a real scenario
                    console.log('ICE candidate:', event.candidate);
                }
            };

            // For outgoing calls, create offer
            if (callState.isOutgoingCall) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                // Send offer to the other peer via Firebase
                // This would be implemented in a real scenario
            }

            // For incoming calls, create answer
            if (callState.isIncomingCall && callState.isActiveCall) {
                // This would handle receiving an offer and creating an answer
                // Simplified for this implementation
            }

        } catch (error) {
            console.error('Error initializing call:', error);
            onCallEnd();
        }
    };

    const startCallTimer = () => {
        durationIntervalRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleEndCall = async () => {
        // Clean up call from Firebase
        if (callState.callWith) {
            const callRef = ref(db, `calls/${callState.callWith}`);
            await remove(callRef);
        }

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        if (peerConnection) {
            peerConnection.close();
        }

        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
        }

        onCallEnd();
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleSpeaker = () => {
        if (remoteAudioRef.current) {
            remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
            setIsSpeakerOn(!isSpeakerOn);
        }
    };

    const handleAcceptCall = async () => {
        // Remove the call invitation from Firebase
        if (callState.callWith) {
            const callRef = ref(db, `calls/${username}`);
            await remove(callRef);
        }
        onCallAccept();
    };

    const handleRejectCall = async () => {
        // Remove the call invitation from Firebase
        if (callState.callWith) {
            const callRef = ref(db, `calls/${username}`);
            await remove(callRef);
        }
        onCallReject();
    };

    const getProfilePhoto = (username) => {
        return userProfiles?.[username]?.profilePhoto || null;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 w-full max-w-md mx-auto shadow-2xl`}>
                {/* Call Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        {getProfilePhoto(callState.callWith) ? (
                            <img
                                src={getProfilePhoto(callState.callWith)}
                                alt={callState.callWith}
                                className="w-20 h-20 rounded-full object-cover border-4 border-[#0084ff]"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-[#0084ff] flex items-center justify-center text-white text-2xl font-bold">
                                {callState.callWith?.charAt(0)?.toUpperCase()}
                            </div>
                        )}
                    </div>

                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>
                        {callState.callWith}
                    </h2>

                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {callState.isIncomingCall && !callState.isActiveCall && 'Incoming audio call...'}
                        {callState.isOutgoingCall && !callState.isActiveCall && 'Calling...'}
                        {callState.isActiveCall && `Call duration: ${formatDuration(callDuration)}`}
                    </p>
                </div>

                {/* Call Controls */}
                <div className="flex justify-center space-x-6 mb-6">
                    {/* Mute/Unmute Button */}
                    <button
                        onClick={toggleMute}
                        className={`p-4 rounded-full ${isMuted
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-gray-600 hover:bg-gray-700'
                            } transition-colors`}
                    >
                        {isMuted ? (
                            <FaMicrophoneSlash className="text-white text-xl" />
                        ) : (
                            <FaMicrophone className="text-white text-xl" />
                        )}
                    </button>

                    {/* Speaker Button */}
                    <button
                        onClick={toggleSpeaker}
                        className={`p-4 rounded-full ${!isSpeakerOn
                                ? 'bg-yellow-500 hover:bg-yellow-600'
                                : 'bg-gray-600 hover:bg-gray-700'
                            } transition-colors`}
                    >
                        {isSpeakerOn ? (
                            <FaVolumeUp className="text-white text-xl" />
                        ) : (
                            <FaVolumeMute className="text-white text-xl" />
                        )}
                    </button>
                </div>

                {/* Call Action Buttons */}
                <div className="flex justify-center space-x-6">
                    {callState.isIncomingCall && !callState.isActiveCall ? (
                        <>
                            {/* Accept Call */}
                            <button
                                onClick={handleAcceptCall}
                                className="p-4 bg-green-500 hover:bg-green-600 rounded-full transition-colors"
                            >
                                <FaPhone className="text-white text-xl" />
                            </button>

                            {/* Reject Call */}
                            <button
                                onClick={handleRejectCall}
                                className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                            >
                                <FaPhoneSlash className="text-white text-xl" />
                            </button>
                        </>
                    ) : (
                        /* End Call Button */
                        <button
                            onClick={handleEndCall}
                            className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                        >
                            <FaPhoneSlash className="text-white text-xl" />
                        </button>
                    )}
                </div>

                {/* Hidden audio elements */}
                <audio ref={localAudioRef} muted className="hidden" />
                <audio
                    ref={remoteAudioRef}
                    autoPlay
                    className="hidden"
                    muted={!isSpeakerOn}
                />
            </div>
        </div>
    );
}