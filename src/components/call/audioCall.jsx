'use client';
import { useEffect, useRef, useState } from 'react';
import { ref, remove, set, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebaseConfig';
import { useTheme } from '@/contexts/ThemeContext';
import { FaPhone, FaPhoneSlash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Peer from 'peerjs';
import { formatDuration, getProfilePhoto, getCallStatusText, handleMediaError, startCallTimer, cleanupCall } from '@/utils/call';

export default function AudioCall({ callState, onCallEnd, onCallAccept, onCallReject, username, userProfiles, setCallState }) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const [peer, setPeer] = useState(null);
    const [currentCall, setCurrentCall] = useState(null);
    const [incomingPeerCall, setIncomingPeerCall] = useState(null);

    const localAudioRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const durationIntervalRef = useRef(null);
    const callRefRef = useRef(null);
    const { isDark } = useTheme();

    const audioConstraints = {
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false
    };

    const setupLocalAudio = (stream) => {
        if (localAudioRef.current) {
            localAudioRef.current.srcObject = stream;
            localAudioRef.current.muted = true;
        }
    };

    const setupRemoteAudio = (remoteStream) => {
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch(() => { });
        }
    };

    const handleCallStream = (call) => {
        call.on('stream', (remoteStream) => {
            setRemoteStream(remoteStream);
            setupRemoteAudio(remoteStream);
            setCallState(prev => ({ ...prev, isIncomingCall: false, isOutgoingCall: false, isActiveCall: true }));
            toast.success('Call connected!');
        });
        call.on('close', () => handleEndCall());
        call.on('error', () => toast.error('Call connection error'));
    };

    const getAudioStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
            setLocalStream(stream);
            setupLocalAudio(stream);
            return stream;
        } catch (err) {
            toast.error(handleMediaError(err));
            handleEndCall();
            return null;
        }
    };

    useEffect(() => {
        if (!username) return;
        const peerInstance = new Peer(username, {
            debug: 3,
            config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }
        });
        
        peerInstance.on('open', () => setPeer(peerInstance));
        
        peerInstance.on('call', async (call) => {
            console.log('PeerJS incoming call detected from:', call.peer);
            setIncomingPeerCall(call);
        });
        
        peerInstance.on('error', (err) => toast.error('Connection error: ' + err.message));
        
        return () => { 
            if (peerInstance && !peerInstance.destroyed) peerInstance.destroy(); 
        };
    }, [username]);

    useEffect(() => {
        if (!username) return;
        const callRef = ref(db, `calls/${username}`);
        callRefRef.current = callRef;
        const unsub = onValue(callRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                
                if (data.status === 'ringing' && data.from !== username && !callState.isActiveCall) {
                    setCallState({ 
                        isIncomingCall: true, 
                        isOutgoingCall: false, 
                        isActiveCall: false, 
                        callWith: data.from, 
                        callType: 'audio', 
                        callId: data.callId 
                    });
                }
                
                if (data.status === 'accepted' && callState.isOutgoingCall) {
                    setCallState(prev => ({ 
                        ...prev, 
                        isIncomingCall: false, 
                        isOutgoingCall: false, 
                        isActiveCall: true 
                    }));
                    toast.success('Call connected!');
                }
                
                if (data.status === 'rejected' && callState.isOutgoingCall) {
                    toast.error('Call rejected');
                    handleEndCall();
                }
                
                if (data.status === 'ended') {
                    toast.info('Call ended');
                    handleEndCall();
                }
            }
        });
        return () => { if (callRefRef.current) off(callRefRef.current); };
    }, [username, callState, onCallEnd]);

    useEffect(() => {
        if (callState.isOutgoingCall && peer && callState.callWith && !currentCall) makeCall();
    }, [callState.isOutgoingCall, peer, callState.callWith, currentCall]);

    useEffect(() => {
        if (callState.isActiveCall) startCallTimer(setCallDuration, durationIntervalRef);
        if (callState.isIncomingCall && !callState.isActiveCall) {
            const timeout = setTimeout(() => { 
                if (callState.isIncomingCall) handleRejectCall(); 
            }, 30000);
            return () => clearTimeout(timeout);
        }
        if (callState.isOutgoingCall && !callState.isActiveCall) {
            const timeout = setTimeout(() => { 
                if (callState.isOutgoingCall) handleEndCall(); 
            }, 30000);
            return () => clearTimeout(timeout);
        }
        return () => { if (durationIntervalRef.current) clearInterval(durationIntervalRef.current); };
    }, [callState.isActiveCall, callState.isIncomingCall, callState.isOutgoingCall]);

    const makeCall = async () => {
        if (!peer || !callState.callWith) return;
        const stream = await getAudioStream();
        if (stream) {
            const call = peer.call(callState.callWith, stream);
            setCurrentCall(call);
            handleCallStream(call);
        }
    };

    const handleAcceptCall = async () => {
        if (!incomingPeerCall) {
            toast.error('No incoming call to accept');
            return;
        }

        const stream = await getAudioStream();
        if (stream) {
            incomingPeerCall.answer(stream);
            setCurrentCall(incomingPeerCall);
            handleCallStream(incomingPeerCall);
            setIncomingPeerCall(null);
        }

        if (callState.callWith && username) {
            try {
                await set(ref(db, `calls/${callState.callWith}`), { 
                    from: username, 
                    to: callState.callWith, 
                    status: 'accepted', 
                    callId: callState.callId, 
                    timestamp: Date.now() 
                });
            } catch (err) {
                console.error('Error updating call status:', err);
            }
        }

        setCallState(prev => ({ ...prev, isIncomingCall: false, isActiveCall: true }));
        onCallAccept();
    };

    const handleRejectCall = async () => {
        if (incomingPeerCall) {
            incomingPeerCall.close();
            setIncomingPeerCall(null);
        }

        if (callState.callWith && username) {
            try {
                await set(ref(db, `calls/${callState.callWith}`), { 
                    from: username, 
                    to: callState.callWith, 
                    status: 'rejected', 
                    callId: callState.callId, 
                    timestamp: Date.now() 
                });
            } catch (err) {
                console.error('Error updating call status:', err);
            }
        }

        try {
            await remove(ref(db, `calls/${username}`));
        } catch (err) {
            console.error('Error removing call data:', err);
        }

        cleanupCall(localStream, setLocalStream, currentCall, setCurrentCall, durationIntervalRef, setRemoteStream, setCallDuration, () => { }, () => { }, () => { });
        onCallReject();
    };

    const handleEndCall = async () => {
        if (incomingPeerCall) {
            incomingPeerCall.close();
            setIncomingPeerCall(null);
        }

        if (callState.callWith && username) {
            try {
                await set(ref(db, `calls/${callState.callWith}`), { 
                    from: username, 
                    to: callState.callWith, 
                    status: 'ended', 
                    callId: callState.callId, 
                    endedBy: username, 
                    timestamp: Date.now() 
                });
            } catch (err) { }
        }
        
        try {
            await remove(ref(db, `calls/${username}`));
        } catch (err) { }
        
        cleanupCall(localStream, setLocalStream, currentCall, setCurrentCall, durationIntervalRef, setRemoteStream, setCallDuration, () => { }, () => { }, () => { });
        onCallEnd();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 w-full max-w-md mx-auto shadow-2xl`}>
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        {getProfilePhoto(userProfiles, callState.callWith) ? (
                            <img src={getProfilePhoto(userProfiles, callState.callWith)} alt={callState.callWith} className="w-20 h-20 rounded-full object-cover border-4 border-[#0084ff]" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-[#0084ff] flex items-center justify-center text-white text-2xl font-bold">
                                {callState.callWith?.charAt(0)?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>{callState.callWith}</h2>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{getCallStatusText(callState, callDuration)}</p>
                </div>
                <div className="flex justify-center space-x-6">
                    {callState.isIncomingCall && !callState.isActiveCall ? (
                        <>
                            <button onClick={handleAcceptCall} className="p-4 bg-green-500 hover:bg-green-600 rounded-full transition-colors">
                                <FaPhone className="text-white text-xl" />
                            </button>
                            <button onClick={handleRejectCall} className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors">
                                <FaPhoneSlash className="text-white text-xl" />
                            </button>
                        </>
                    ) : (
                        <button onClick={handleEndCall} className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors">
                            <FaPhoneSlash className="text-white text-xl" />
                        </button>
                    )}
                </div>
                <audio ref={localAudioRef} muted className="hidden" />
                <audio ref={remoteAudioRef} autoPlay className="hidden" />
            </div>
        </div>
    );
}