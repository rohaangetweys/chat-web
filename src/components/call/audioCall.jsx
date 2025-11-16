'use client';
import { useEffect, useRef, useState } from 'react';
import { ref, remove, set, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebaseConfig';
import { useTheme } from '@/contexts/ThemeContext';
import { FaPhone, FaPhoneSlash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Peer from 'peerjs';

export default function AudioCall({ callState, onCallEnd, onCallAccept, onCallReject, username, userProfiles, setCallState }) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const [peer, setPeer] = useState(null);
    const [currentCall, setCurrentCall] = useState(null);
    
    const localAudioRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const durationIntervalRef = useRef(null);
    const callRefRef = useRef(null);
    const { isDark } = useTheme();

    // Initialize PeerJS
    useEffect(() => {
        if (!username) return;

        console.log('Initializing PeerJS with ID:', username);
        
        // PeerJS configuration
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

        // Listen for incoming calls
        peerInstance.on('call', async (call) => {
            console.log('📞 Incoming call from:', call.peer);
            
            try {
                // Get microphone access
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    },
                    video: false 
                });
                
                console.log('🎤 Local stream obtained');
                setLocalStream(stream);
                
                // Setup local audio
                if (localAudioRef.current) {
                    localAudioRef.current.srcObject = stream;
                    localAudioRef.current.muted = true; // Mute local audio to avoid echo
                }

                // Answer the call
                call.answer(stream);
                setCurrentCall(call);
                
                // Handle remote stream
                call.on('stream', (remoteStream) => {
                    console.log('🔊 Remote stream received');
                    setRemoteStream(remoteStream);
                    
                    if (remoteAudioRef.current) {
                        remoteAudioRef.current.srcObject = remoteStream;
                        remoteAudioRef.current.play()
                            .then(() => console.log('▶️ Remote audio playing'))
                            .catch(err => console.error('❌ Remote audio play failed:', err));
                    }
                });

                call.on('close', () => {
                    console.log('📞 Call closed by remote');
                    handleEndCall();
                });

                call.on('error', (err) => {
                    console.error('❌ Call error:', err);
                    toast.error('Call connection error');
                });

            } catch (err) {
                console.error('❌ Error getting microphone:', err);
                toast.error('Microphone access denied');
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
        
        console.log('👂 Listening for call updates...');
        
        const unsub = onValue(callRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log('📨 Call data received:', data);
                
                // Handle incoming call
                if (data.status === 'ringing' && data.from !== username && !callState.isActiveCall) {
                    console.log('🔄 Setting incoming call state');
                    setCallState({ 
                        isIncomingCall: true, 
                        isOutgoingCall: false, 
                        isActiveCall: false, 
                        callWith: data.from, 
                        callType: 'audio', 
                        callId: data.callId 
                    });
                }
                
                // Handle call acceptance
                if (data.status === 'accepted' && callState.isOutgoingCall) {
                    console.log('✅ Call accepted by remote');
                    setCallState(prev => ({ 
                        ...prev, 
                        isIncomingCall: false, 
                        isOutgoingCall: false, 
                        isActiveCall: true 
                    }));
                    toast.success('Call connected!');
                }
                
                // Handle call rejection
                if (data.status === 'rejected' && callState.isOutgoingCall) {
                    console.log('❌ Call rejected by remote');
                    toast.error('Call rejected');
                    handleEndCall();
                }
                
                // Handle call ended
                if (data.status === 'ended') {
                    console.log('📞 Call ended by remote');
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

    // Handle outgoing call
    useEffect(() => {
        if (callState.isOutgoingCall && peer && callState.callWith && !currentCall) {
            console.log('🟡 Starting outgoing call to:', callState.callWith);
            makeCall();
        }
    }, [callState.isOutgoingCall, peer, callState.callWith, currentCall]);

    // Handle call timers
    useEffect(() => {
        if (callState.isActiveCall) {
            console.log('⏰ Starting call timer');
            startCallTimer();
        }

        // Auto timeouts
        if (callState.isIncomingCall && !callState.isActiveCall) {
            const timeout = setTimeout(() => {
                if (callState.isIncomingCall) {
                    console.log('⏰ Auto-rejecting call after 30s');
                    handleRejectCall();
                }
            }, 30000);
            return () => clearTimeout(timeout);
        }

        if (callState.isOutgoingCall && !callState.isActiveCall) {
            const timeout = setTimeout(() => {
                if (callState.isOutgoingCall) {
                    console.log('⏰ Auto-ending call after 30s');
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

    // Make outgoing call
    const makeCall = async () => {
        if (!peer || !callState.callWith) {
            console.error('❌ Peer or callWith missing');
            return;
        }

        try {
            console.log('🎤 Getting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false 
            });
            
            console.log('✅ Microphone access granted');
            setLocalStream(stream);
            
            // Setup local audio
            if (localAudioRef.current) {
                localAudioRef.current.srcObject = stream;
                localAudioRef.current.muted = true; // Mute local audio
            }

            console.log('📞 Making call to:', callState.callWith);
            const call = peer.call(callState.callWith, stream);
            setCurrentCall(call);

            // Handle remote stream
            call.on('stream', (remoteStream) => {
                console.log('🔊 Remote stream received in outgoing call');
                setRemoteStream(remoteStream);
                
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStream;
                    remoteAudioRef.current.play()
                        .then(() => console.log('▶️ Remote audio playing'))
                        .catch(err => console.error('❌ Remote audio play failed:', err));
                }

                // Update call state
                setCallState(prev => ({ 
                    ...prev, 
                    isIncomingCall: false, 
                    isOutgoingCall: false, 
                    isActiveCall: true 
                }));
            });

            call.on('close', () => {
                console.log('📞 Call closed by remote');
                handleEndCall();
            });

            call.on('error', (err) => {
                console.error('❌ Call error:', err);
                toast.error('Call failed: ' + err.message);
                handleEndCall();
            });

        } catch (error) {
            console.error('❌ Error making call:', error);
            toast.error('Failed to access microphone');
            handleEndCall();
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
        console.log('🧹 Cleaning up call...');
        
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

        // Reset streams
        setRemoteStream(null);
        setCallDuration(0);
    };

    const handleEndCall = async () => {
        console.log('📞 Ending call...');
        
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
                console.log('✅ Call end notification sent');
            } catch (err) {
                console.error('❌ Error sending end notification:', err);
            }
        }

        // Clean up local data
        try {
            const currentUserCallRef = ref(db, `calls/${username}`);
            await remove(currentUserCallRef);
            console.log('✅ Local call data cleaned');
        } catch (err) {
            console.error('❌ Error cleaning local call data:', err);
        }

        cleanupCall();
        onCallEnd();
    };

    const handleAcceptCall = async () => {
        console.log('✅ Accepting call...');
        
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
                console.log('✅ Call acceptance sent');
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
        console.log('❌ Rejecting call...');
        
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
                console.log('✅ Call rejection sent');
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
                <audio 
                    ref={localAudioRef} 
                    muted 
                    className="hidden" 
                />
                <audio 
                    ref={remoteAudioRef} 
                    autoPlay 
                    className="hidden"
                />
            </div>
        </div>
    );
}