'use client';
import { useEffect, useRef, useState } from 'react';
import { ref, remove, set, onValue, off, push } from 'firebase/database';
import { db } from '@/lib/firebaseConfig';
import { useTheme } from '@/contexts/ThemeContext';
import { FaPhone, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function AudioCall({ callState, onCallEnd, onCallAccept, onCallReject, username, userProfiles, setCallState }) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [peerConnection, setPeerConnection] = useState(null);
    const [callData, setCallData] = useState(null);
    
    const localAudioRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const durationIntervalRef = useRef(null);
    const callRefRef = useRef(null);
    const { isDark } = useTheme();

    // WebRTC configuration
    const pcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    // Listen for call updates
    useEffect(() => {
        if (!username) return;

        const callRef = ref(db, `calls/${username}`);
        callRefRef.current = callRef;
        
        const unsub = onValue(callRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setCallData(data);
                console.log('Call data received:', data);
                
                // Handle incoming call
                if (data.status === 'ringing' && data.from !== username && !callState.isActiveCall && !callState.isOutgoingCall) {
                    console.log('Incoming call from:', data.from);
                    setCallState({ 
                        isIncomingCall: true, 
                        isOutgoingCall: false, 
                        isActiveCall: false, 
                        callWith: data.from, 
                        callType: data.type || 'audio', 
                        callId: data.callId 
                    });
                }
                
                // Handle call acceptance for outgoing calls
                if (data.status === 'accepted' && callState.isOutgoingCall && callState.callWith === data.from) {
                    console.log('Call accepted by:', data.from);
                    setCallState(prev => ({ 
                        ...prev, 
                        isIncomingCall: false, 
                        isOutgoingCall: false, 
                        isActiveCall: true 
                    }));
                    toast.success('Call accepted!');
                }
                
                // Handle call rejection
                if (data.status === 'rejected' && callState.isOutgoingCall && callState.callWith === data.from) {
                    console.log('Call rejected by:', data.from);
                    toast.error('Call rejected');
                    cleanupCall();
                    onCallEnd();
                }
                
                // Handle call ended by remote user
                if (data.status === 'ended' && (callState.isActiveCall || callState.isOutgoingCall || callState.isIncomingCall)) {
                    console.log('Call ended by remote user');
                    toast.info('Call ended by other user');
                    cleanupCall();
                    onCallEnd();
                }

                // Handle WebRTC offer for incoming calls
                if (data.offer && callState.isIncomingCall && callState.isActiveCall && !peerConnection) {
                    console.log('Received WebRTC offer');
                    handleWebRTCOffer(data.offer);
                }

                // Handle WebRTC answer for outgoing calls
                if (data.answer && callState.isOutgoingCall && callState.isActiveCall && peerConnection) {
                    console.log('Received WebRTC answer');
                    handleWebRTCAnswer(data.answer);
                }

                // Handle ICE candidates
                if (data.iceCandidates && peerConnection) {
                    console.log('Received ICE candidates');
                    handleICECandidates(data.iceCandidates);
                }
            }
        });

        return () => {
            if (callRefRef.current) {
                off(callRefRef.current);
            }
        };
    }, [username, callState, onCallEnd, peerConnection]);

    // Initialize call when active
    useEffect(() => {
        if (callState.isActiveCall) {
            initializeWebRTC();
            startCallTimer();
        }

        // Auto-reject timeout for incoming calls
        if (callState.isIncomingCall && !callState.isActiveCall) {
            const timeout = setTimeout(() => {
                if (callState.isIncomingCall) {
                    handleRejectCall();
                }
            }, 30000);

            return () => clearTimeout(timeout);
        }

        // Auto-cancel timeout for outgoing calls
        if (callState.isOutgoingCall && !callState.isActiveCall) {
            const timeout = setTimeout(() => {
                if (callState.isOutgoingCall) {
                    handleEndCall();
                }
            }, 30000);

            return () => clearTimeout(timeout);
        }

        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, [callState.isActiveCall, callState.isIncomingCall, callState.isOutgoingCall]);

    const initializeWebRTC = async () => {
        try {
            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1
                },
                video: false
            });
            
            setLocalStream(stream);
            
            if (localAudioRef.current) {
                localAudioRef.current.srcObject = stream;
            }

            // Create peer connection
            const pc = new RTCPeerConnection(pcConfig);
            setPeerConnection(pc);

            // Add local tracks to peer connection
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Handle incoming remote stream
            pc.ontrack = (event) => {
                console.log('Received remote stream');
                const remoteStream = event.streams[0];
                setRemoteStream(remoteStream);
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStream;
                }
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('Sending ICE candidate');
                    sendICECandidate(event.candidate);
                }
            };

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                console.log('Connection state:', pc.connectionState);
                if (pc.connectionState === 'connected') {
                    console.log('WebRTC connection established');
                    toast.success('Call connected!');
                } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                    console.log('WebRTC connection failed');
                    toast.error('Call connection failed');
                    handleEndCall();
                }
            };

            // Create and send offer for outgoing calls
            if (callState.isOutgoingCall) {
                console.log('Creating WebRTC offer');
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                await sendOffer(offer);
            }

        } catch (error) {
            console.error('Error initializing WebRTC:', error);
            toast.error('Failed to initialize call');
            handleEndCall();
        }
    };

    const handleWebRTCOffer = async (offer) => {
        if (!peerConnection) return;
        
        try {
            console.log('Setting remote description from offer');
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            
            console.log('Creating answer');
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            console.log('Sending answer');
            await sendAnswer(answer);
        } catch (error) {
            console.error('Error handling WebRTC offer:', error);
        }
    };

    const handleWebRTCAnswer = async (answer) => {
        if (!peerConnection) return;
        
        try {
            console.log('Setting remote description from answer');
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            console.error('Error handling WebRTC answer:', error);
        }
    };

    const handleICECandidates = async (candidates) => {
        if (!peerConnection) return;
        
        try {
            for (const candidateId in candidates) {
                const candidate = candidates[candidateId];
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    };

    const sendOffer = async (offer) => {
        if (!callState.callWith || !username) return;
        
        const callRef = ref(db, `calls/${callState.callWith}`);
        await set(callRef, {
            from: username,
            to: callState.callWith,
            type: 'audio',
            status: 'ringing',
            callId: callState.callId || `${username}_${callState.callWith}_${Date.now()}`,
            offer: offer,
            timestamp: Date.now()
        });
        console.log('WebRTC offer sent to:', callState.callWith);
    };

    const sendAnswer = async (answer) => {
        if (!callState.callWith || !username) return;
        
        const callRef = ref(db, `calls/${callState.callWith}`);
        await set(callRef, {
            from: username,
            to: callState.callWith,
            status: 'accepted',
            callId: callState.callId,
            answer: answer,
            timestamp: Date.now()
        });
        console.log('WebRTC answer sent to:', callState.callWith);
    };

    const sendICECandidate = async (candidate) => {
        if (!callState.callWith || !username) return;
        
        const iceRef = ref(db, `calls/${callState.callWith}/iceCandidates`);
        const newIceRef = push(iceRef);
        await set(newIceRef, candidate.toJSON());
        console.log('ICE candidate sent');
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

    const cleanupCall = async () => {
        console.log('Cleaning up call...');
        
        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        // Close peer connection
        if (peerConnection) {
            peerConnection.close();
            setPeerConnection(null);
        }

        // Clear timer
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
        }

        // Reset remote stream
        setRemoteStream(null);
        setCallDuration(0);
    };

    const handleEndCall = async () => {
        console.log('Ending call...');
        
        // Notify the other user that call ended
        if (callState.callWith && username) {
            const callRef = ref(db, `calls/${callState.callWith}`);
            await set(callRef, {
                from: username,
                to: callState.callWith,
                status: 'ended',
                callId: callState.callId,
                endedBy: username,
                timestamp: Date.now()
            });
        }

        // Clean up current user's call data
        const currentUserCallRef = ref(db, `calls/${username}`);
        await remove(currentUserCallRef);

        await cleanupCall();
        onCallEnd();
    };

    const handleAcceptCall = async () => {
        console.log('Accepting call...');
        
        // Notify the caller that call was accepted
        if (callState.callWith && username) {
            const callRef = ref(db, `calls/${callState.callWith}`);
            await set(callRef, {
                from: username,
                to: callState.callWith,
                status: 'accepted',
                callId: callState.callId,
                timestamp: Date.now()
            });
        }

        // Set call as active immediately for better UX
        setCallState(prev => ({ 
            ...prev, 
            isIncomingCall: false, 
            isActiveCall: true 
        }));
        
        onCallAccept();
    };

    const handleRejectCall = async () => {
        console.log('Rejecting call...');
        
        // Notify the caller that call was rejected
        if (callState.callWith && username) {
            const callRef = ref(db, `calls/${callState.callWith}`);
            await set(callRef, {
                from: username,
                to: callState.callWith,
                status: 'rejected',
                callId: callState.callId,
                timestamp: Date.now()
            });
        }

        // Clean up current user's call data
        const currentUserCallRef = ref(db, `calls/${username}`);
        await remove(currentUserCallRef);

        await cleanupCall();
        onCallReject();
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

    const getProfilePhoto = (username) => {
        return userProfiles?.[username]?.profilePhoto || null;
    };

    const getCallStatusText = () => {
        if (callState.isIncomingCall && !callState.isActiveCall) {
            return 'Incoming audio call...';
        }
        if (callState.isOutgoingCall && !callState.isActiveCall) {
            return 'Calling...';
        }
        if (callState.isActiveCall) {
            return `Call duration: ${formatDuration(callDuration)}`;
        }
        return '';
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
                        {getCallStatusText()}
                    </p>
                </div>

                {/* Call Controls - Only show during active call */}
                {(callState.isActiveCall) && (
                    <div className="flex justify-center space-x-6 mb-6">
                        {/* Mute/Unmute Button */}
                        <button
                            onClick={toggleMute}
                            className={`p-4 rounded-full ${
                                isMuted 
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
                            className={`p-4 rounded-full ${
                                !isSpeakerOn 
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
                )}

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