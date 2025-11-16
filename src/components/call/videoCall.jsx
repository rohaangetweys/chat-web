'use client';
import { useEffect, useRef, useState } from 'react';
import { ref, remove, set, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebaseConfig';
import { useTheme } from '@/contexts/ThemeContext';
import { FaPhone, FaPhoneSlash, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Peer from 'peerjs';

export default function VideoCall({ callState, onCallEnd, onCallAccept, onCallReject, username, userProfiles, setCallState }) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const [peer, setPeer] = useState(null);
    const [currentCall, setCurrentCall] = useState(null);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);
    const [isCallConnected, setIsCallConnected] = useState(false);
    
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const durationIntervalRef = useRef(null);
    const callRefRef = useRef(null);
    const { isDark } = useTheme();

    // Initialize PeerJS
    useEffect(() => {
        if (!username) return;

        console.log('🎥 Initializing PeerJS for video call with ID:', username);
        
        const peerInstance = new Peer(username, {
            debug: 3,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        });

        peerInstance.on('open', (id) => {
            console.log('✅ PeerJS connected with ID:', id);
            setPeer(peerInstance);
        });

        // Listen for incoming video calls
        peerInstance.on('call', async (call) => {
            console.log('📹 Incoming video call from:', call.peer);
            
            try {
                // Get camera and microphone access
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 30 }
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                
                console.log('🎥 Camera and microphone access granted');
                setLocalStream(stream);
                
                // Setup local video - IMPORTANT: Wait for video element to be ready
                setTimeout(() => {
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                        localVideoRef.current.muted = true; // Mute local audio
                        localVideoRef.current.play().catch(err => {
                            console.error('❌ Local video play failed:', err);
                        });
                        console.log('✅ Local video setup complete');
                    }
                }, 100);

                // Answer the call
                call.answer(stream);
                setCurrentCall(call);
                
                // Handle remote stream
                call.on('stream', (remoteStream) => {
                    console.log('🔊 Remote video stream received');
                    setRemoteStream(remoteStream);
                    setIsCallConnected(true);
                    
                    // Setup remote video with delay to ensure DOM is ready
                    setTimeout(() => {
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = remoteStream;
                            remoteVideoRef.current.play()
                                .then(() => {
                                    console.log('▶️ Remote video playing successfully');
                                    toast.success('Video call connected!');
                                })
                                .catch(err => {
                                    console.error('❌ Remote video play failed:', err);
                                    // Try to play with user interaction
                                    document.addEventListener('click', function playVideo() {
                                        remoteVideoRef.current.play();
                                        document.removeEventListener('click', playVideo);
                                    });
                                });
                        }
                    }, 500);
                });

                call.on('close', () => {
                    console.log('📹 Video call closed by remote');
                    handleEndCall();
                });

                call.on('error', (err) => {
                    console.error('❌ Video call error:', err);
                    toast.error('Video call connection error');
                });

            } catch (err) {
                console.error('❌ Error getting camera/microphone:', err);
                if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    toast.error('Camera not found. Please check your camera connection.');
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    toast.error('Camera is already in use by another application.');
                } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
                    toast.error('Camera constraints cannot be satisfied. Please try different settings.');
                } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    toast.error('Camera permission denied. Please allow camera access.');
                } else if (err.name === 'TypeError' || err.name === 'TypeError') {
                    toast.error('Camera access failed. Please try again.');
                } else {
                    toast.error('Cannot access camera: ' + err.message);
                }
                handleEndCall();
            }
        });

        peerInstance.on('error', (err) => {
            console.error('❌ PeerJS error:', err);
            toast.error('Connection error: ' + err.message);
        });

        return () => {
            if (peerInstance && !peerInstance.destroyed) {
                console.log('🧹 Cleaning up PeerJS instance');
                peerInstance.destroy();
            }
        };
    }, [username]);

    // Listen for Firebase call signals
    useEffect(() => {
        if (!username) return;

        const callRef = ref(db, `calls/${username}`);
        callRefRef.current = callRef;
        
        console.log('👂 Listening for video call updates...');
        
        const unsub = onValue(callRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log('📨 Video call data received:', data);
                
                // Handle incoming call
                if (data.status === 'ringing' && data.from !== username && !callState.isActiveCall) {
                    console.log('🔄 Setting incoming video call state');
                    setCallState({ 
                        isIncomingCall: true, 
                        isOutgoingCall: false, 
                        isActiveCall: false, 
                        callWith: data.from, 
                        callType: 'video', 
                        callId: data.callId 
                    });
                }
                
                // Handle call acceptance
                if (data.status === 'accepted' && callState.isOutgoingCall) {
                    console.log('✅ Video call accepted by remote');
                    setCallState(prev => ({ 
                        ...prev, 
                        isIncomingCall: false, 
                        isOutgoingCall: false, 
                        isActiveCall: true 
                    }));
                }
                
                // Handle call rejection
                if (data.status === 'rejected' && callState.isOutgoingCall) {
                    console.log('❌ Video call rejected by remote');
                    toast.error('Video call rejected');
                    handleEndCall();
                }
                
                // Handle call ended
                if (data.status === 'ended') {
                    console.log('📹 Video call ended by remote');
                    toast.info('Video call ended');
                    handleEndCall();
                }
            }
        });

        return () => {
            if (callRefRef.current) {
                off(callRefRef.current);
            }
        };
    }, [username, callState, onCallEnd]);

    // Handle outgoing video call
    useEffect(() => {
        if (callState.isOutgoingCall && peer && callState.callWith && !currentCall) {
            console.log('🟡 Starting outgoing video call to:', callState.callWith);
            makeVideoCall();
        }
    }, [callState.isOutgoingCall, peer, callState.callWith, currentCall]);

    // Handle call timers
    useEffect(() => {
        if (callState.isActiveCall) {
            console.log('⏰ Starting video call timer');
            startCallTimer();
        }

        // Auto timeouts
        if (callState.isIncomingCall && !callState.isActiveCall) {
            const timeout = setTimeout(() => {
                if (callState.isIncomingCall) {
                    console.log('⏰ Auto-rejecting video call after 30s');
                    handleRejectCall();
                }
            }, 30000);
            return () => clearTimeout(timeout);
        }

        if (callState.isOutgoingCall && !callState.isActiveCall) {
            const timeout = setTimeout(() => {
                if (callState.isOutgoingCall) {
                    console.log('⏰ Auto-ending video call after 30s');
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

    // Make outgoing video call
    const makeVideoCall = async () => {
        if (!peer || !callState.callWith) {
            console.error('❌ Peer or callWith missing');
            return;
        }

        try {
            console.log('🎥 Getting camera and microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            console.log('✅ Camera and microphone access granted');
            setLocalStream(stream);
            
            // Setup local video with delay
            setTimeout(() => {
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    localVideoRef.current.muted = true;
                    localVideoRef.current.play().catch(err => {
                        console.error('❌ Local video play failed:', err);
                    });
                    console.log('✅ Local video setup complete for outgoing call');
                }
            }, 100);

            console.log('📹 Making video call to:', callState.callWith);
            const call = peer.call(callState.callWith, stream);
            setCurrentCall(call);

            // Handle remote stream
            call.on('stream', (remoteStream) => {
                console.log('🔊 Remote video stream received in outgoing call');
                setRemoteStream(remoteStream);
                setIsCallConnected(true);
                
                // Setup remote video with delay
                setTimeout(() => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = remoteStream;
                        remoteVideoRef.current.play()
                            .then(() => {
                                console.log('▶️ Remote video playing successfully in outgoing call');
                                toast.success('Video call connected!');
                            })
                            .catch(err => {
                                console.error('❌ Remote video play failed in outgoing call:', err);
                                document.addEventListener('click', function playVideo() {
                                    remoteVideoRef.current.play();
                                    document.removeEventListener('click', playVideo);
                                });
                            });
                    }
                }, 500);

                // Update call state
                setCallState(prev => ({ 
                    ...prev, 
                    isIncomingCall: false, 
                    isOutgoingCall: false, 
                    isActiveCall: true 
                }));
            });

            call.on('close', () => {
                console.log('📹 Video call closed by remote');
                handleEndCall();
            });

            call.on('error', (err) => {
                console.error('❌ Video call error:', err);
                toast.error('Video call failed: ' + err.message);
                handleEndCall();
            });

        } catch (error) {
            console.error('❌ Error making video call:', error);
            if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                toast.error('Camera not found. Please check your camera connection.');
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                toast.error('Camera is already in use by another application.');
            } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
                toast.error('Camera constraints cannot be satisfied. Please try different settings.');
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                toast.error('Camera permission denied. Please allow camera access.');
            } else {
                toast.error('Cannot access camera: ' + error.message);
            }
            handleEndCall();
        }
    };

    // Toggle video
    const toggleVideo = () => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            if (videoTracks.length > 0) {
                videoTracks.forEach(track => {
                    track.enabled = !track.enabled;
                });
                setIsVideoOn(!isVideoOn);
                toast.info(isVideoOn ? 'Video turned off' : 'Video turned on');
            } else {
                toast.error('No video track found');
            }
        }
    };

    // Toggle audio
    const toggleAudio = () => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                audioTracks.forEach(track => {
                    track.enabled = !track.enabled;
                });
                setIsAudioOn(!isAudioOn);
                toast.info(isAudioOn ? 'Microphone muted' : 'Microphone unmuted');
            } else {
                toast.error('No audio track found');
            }
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

    const cleanupCall = () => {
        console.log('🧹 Cleaning up video call...');
        
        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
                console.log('🛑 Stopped track:', track.kind);
            });
            setLocalStream(null);
        }

        // Close call
        if (currentCall) {
            currentCall.close();
            setCurrentCall(null);
        }

        // Clear timer
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }

        // Reset streams and states
        setRemoteStream(null);
        setCallDuration(0);
        setIsVideoOn(true);
        setIsAudioOn(true);
        setIsCallConnected(false);
    };

    const handleEndCall = async () => {
        console.log('📹 Ending video call...');
        
        // Notify other user
        if (callState.callWith && username) {
            try {
                const callRef = ref(db, `calls/${callState.callWith}`);
                await set(callRef, {
                    from: username,
                    to: callState.callWith,
                    status: 'ended',
                    callId: callState.callId,
                    endedBy: username,
                    timestamp: Date.now()
                });
                console.log('✅ Video call end notification sent');
            } catch (err) {
                console.error('❌ Error sending end notification:', err);
            }
        }

        // Clean up local data
        try {
            const currentUserCallRef = ref(db, `calls/${username}`);
            await remove(currentUserCallRef);
            console.log('✅ Local video call data cleaned');
        } catch (err) {
            console.error('❌ Error cleaning local call data:', err);
        }

        cleanupCall();
        onCallEnd();
    };

    const handleAcceptCall = async () => {
        console.log('✅ Accepting video call...');
        
        // Notify caller
        if (callState.callWith && username) {
            try {
                const callRef = ref(db, `calls/${callState.callWith}`);
                await set(callRef, {
                    from: username,
                    to: callState.callWith,
                    status: 'accepted',
                    callId: callState.callId,
                    timestamp: Date.now()
                });
                console.log('✅ Video call acceptance sent');
            } catch (err) {
                console.error('❌ Error sending acceptance:', err);
            }
        }

        setCallState(prev => ({ 
            ...prev, 
            isIncomingCall: false, 
            isActiveCall: true 
        }));
        
        onCallAccept();
    };

    const handleRejectCall = async () => {
        console.log('❌ Rejecting video call...');
        
        // Notify caller
        if (callState.callWith && username) {
            try {
                const callRef = ref(db, `calls/${callState.callWith}`);
                await set(callRef, {
                    from: username,
                    to: callState.callWith,
                    status: 'rejected',
                    callId: callState.callId,
                    timestamp: Date.now()
                });
                console.log('✅ Video call rejection sent');
            } catch (err) {
                console.error('❌ Error sending rejection:', err);
            }
        }

        // Clean up local data
        try {
            const currentUserCallRef = ref(db, `calls/${username}`);
            await remove(currentUserCallRef);
        } catch (err) {
            console.error('❌ Error cleaning call data:', err);
        }

        cleanupCall();
        onCallReject();
    };

    const getProfilePhoto = (username) => {
        return userProfiles?.[username]?.profilePhoto || null;
    };

    const getCallStatusText = () => {
        if (callState.isIncomingCall && !callState.isActiveCall) {
            return 'Incoming video call...';
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
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full h-full max-w-6xl mx-auto shadow-2xl flex flex-col`}>
                
                {/* Call Header */}
                <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                        {getProfilePhoto(callState.callWith) ? (
                            <img
                                src={getProfilePhoto(callState.callWith)}
                                alt={callState.callWith}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-[#0084ff] flex items-center justify-center text-white font-bold">
                                {callState.callWith?.charAt(0)?.toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h2 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {callState.callWith}
                            </h2>
                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {getCallStatusText()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Video Area */}
                <div className="flex-1 relative bg-black rounded-b-2xl overflow-hidden">
                    {/* Remote Video (Main) */}
                    {remoteStream && isCallConnected ? (
                        <video 
                            ref={remoteVideoRef} 
                            autoPlay 
                            playsInline
                            className="w-full h-full object-cover"
                            onLoadedMetadata={() => console.log('✅ Remote video metadata loaded')}
                            onCanPlay={() => console.log('✅ Remote video can play')}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <div className="text-center">
                                <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                                    {getProfilePhoto(callState.callWith) ? (
                                        <img
                                            src={getProfilePhoto(callState.callWith)}
                                            alt={callState.callWith}
                                            className="w-20 h-20 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-[#0084ff] flex items-center justify-center text-white text-2xl font-bold">
                                            {callState.callWith?.charAt(0)?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <p className="text-white text-lg">
                                    {callState.isActiveCall ? 'Connecting video...' : 'Waiting for call...'}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Local Video (Picture-in-Picture) */}
                    {localStream && (
                        <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-900 rounded-lg overflow-hidden shadow-2xl border-2 border-white">
                            <video 
                                ref={localVideoRef} 
                                autoPlay 
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                                onLoadedMetadata={() => console.log('✅ Local video metadata loaded')}
                                onCanPlay={() => console.log('✅ Local video can play')}
                            />
                            {!isVideoOn && (
                                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                                    <FaVideoSlash className="text-white text-2xl" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Call Controls */}
                <div className="p-6 flex justify-center items-center gap-6">
                    {callState.isIncomingCall && !callState.isActiveCall ? (
                        <>
                            {/* Accept Call */}
                            <button
                                onClick={handleAcceptCall}
                                className="p-4 bg-green-500 hover:bg-green-600 rounded-full transition-colors shadow-lg"
                            >
                                <FaVideo className="text-white text-xl" />
                            </button>
                            
                            {/* Reject Call */}
                            <button
                                onClick={handleRejectCall}
                                className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-lg"
                            >
                                <FaPhoneSlash className="text-white text-xl" />
                            </button>
                        </>
                    ) : callState.isActiveCall ? (
                        <>
                            {/* Video Toggle */}
                            <button
                                onClick={toggleVideo}
                                className={`p-4 rounded-full transition-colors shadow-lg ${
                                    isVideoOn 
                                        ? 'bg-gray-600 hover:bg-gray-700' 
                                        : 'bg-red-500 hover:bg-red-600'
                                }`}
                            >
                                {isVideoOn ? (
                                    <FaVideo className="text-white text-xl" />
                                ) : (
                                    <FaVideoSlash className="text-white text-xl" />
                                )}
                            </button>

                            {/* Audio Toggle */}
                            <button
                                onClick={toggleAudio}
                                className={`p-4 rounded-full transition-colors shadow-lg ${
                                    isAudioOn 
                                        ? 'bg-gray-600 hover:bg-gray-700' 
                                        : 'bg-red-500 hover:bg-red-600'
                                }`}
                            >
                                {isAudioOn ? (
                                    <FaMicrophone className="text-white text-xl" />
                                ) : (
                                    <FaMicrophoneSlash className="text-white text-xl" />
                                )}
                            </button>

                            {/* End Call */}
                            <button
                                onClick={handleEndCall}
                                className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-lg"
                            >
                                <FaPhoneSlash className="text-white text-xl" />
                            </button>
                        </>
                    ) : (
                        /* End Call Button for outgoing calls */
                        <button
                            onClick={handleEndCall}
                            className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-lg"
                        >
                            <FaPhoneSlash className="text-white text-xl" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}