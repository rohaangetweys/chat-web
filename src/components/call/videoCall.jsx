'use client';
import { useEffect, useRef, useState } from 'react';
import { ref, remove, set, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebaseConfig';
import { useTheme } from '@/contexts/ThemeContext';
import { FaPhone, FaPhoneSlash, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Peer from 'peerjs';
import { formatDuration, getProfilePhoto, getCallStatusText, handleMediaError, startCallTimer, cleanupCall } from '@/utils/call';


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

    const mediaConstraints = {
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    };

    const setupLocalVideo = (stream) => {
        setTimeout(() => {
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.muted = true;
                localVideoRef.current.play().catch(() => { });
            }
        }, 100);
    };

    const setupRemoteVideo = (remoteStream) => {
        setTimeout(() => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
                remoteVideoRef.current.play()
                    .then(() => toast.success('Video call connected!'))
                    .catch(() => {
                        document.addEventListener('click', function playVideo() {
                            remoteVideoRef.current.play();
                            document.removeEventListener('click', playVideo);
                        });
                    });
            }
        }, 500);
    };

    const handleCallStream = (call) => {
        call.on('stream', (remoteStream) => {
            setRemoteStream(remoteStream);
            setIsCallConnected(true);
            setupRemoteVideo(remoteStream);
            setCallState(prev => ({ ...prev, isIncomingCall: false, isOutgoingCall: false, isActiveCall: true }));
        });
        call.on('close', () => handleEndCall());
        call.on('error', () => toast.error('Video call connection error'));
    };

    const getMediaStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
            setLocalStream(stream);
            setupLocalVideo(stream);
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
            const stream = await getMediaStream();
            if (stream) {
                call.answer(stream);
                setCurrentCall(call);
                handleCallStream(call);
            }
        });
        peerInstance.on('error', (err) => toast.error('Connection error: ' + err.message));
        return () => { if (peerInstance && !peerInstance.destroyed) peerInstance.destroy(); };
    }, [username]);

    useEffect(() => {
        if (!username) return;
        const callRef = ref(db, `calls/${username}`);
        callRefRef.current = callRef;
        const unsub = onValue(callRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data.status === 'ringing' && data.from !== username && !callState.isActiveCall) {
                    setCallState({ isIncomingCall: true, isOutgoingCall: false, isActiveCall: false, callWith: data.from, callType: 'video', callId: data.callId });
                }
                if (data.status === 'accepted' && callState.isOutgoingCall) {
                    setCallState(prev => ({ ...prev, isIncomingCall: false, isOutgoingCall: false, isActiveCall: true }));
                }
                if (data.status === 'rejected' && callState.isOutgoingCall) {
                    toast.error('Video call rejected');
                    handleEndCall();
                }
                if (data.status === 'ended') {
                    toast.info('Video call ended');
                    handleEndCall();
                }
            }
        });
        return () => { if (callRefRef.current) off(callRefRef.current); };
    }, [username, callState, onCallEnd]);

    useEffect(() => {
        if (callState.isOutgoingCall && peer && callState.callWith && !currentCall) makeVideoCall();
    }, [callState.isOutgoingCall, peer, callState.callWith, currentCall]);

    useEffect(() => {
        if (callState.isActiveCall) startCallTimer(setCallDuration, durationIntervalRef);
        if (callState.isIncomingCall && !callState.isActiveCall) {
            const timeout = setTimeout(() => { if (callState.isIncomingCall) handleRejectCall(); }, 30000);
            return () => clearTimeout(timeout);
        }
        if (callState.isOutgoingCall && !callState.isActiveCall) {
            const timeout = setTimeout(() => { if (callState.isOutgoingCall) handleEndCall(); }, 30000);
            return () => clearTimeout(timeout);
        }
        return () => { if (durationIntervalRef.current) clearInterval(durationIntervalRef.current); };
    }, [callState.isActiveCall, callState.isIncomingCall, callState.isOutgoingCall]);

    const makeVideoCall = async () => {
        if (!peer || !callState.callWith) return;
        const stream = await getMediaStream();
        if (stream) {
            const call = peer.call(callState.callWith, stream);
            setCurrentCall(call);
            handleCallStream(call);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            if (videoTracks.length > 0) {
                videoTracks.forEach(track => track.enabled = !track.enabled);
                setIsVideoOn(!isVideoOn);
                toast.info(isVideoOn ? 'Video turned off' : 'Video turned on');
            } else toast.error('No video track found');
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                audioTracks.forEach(track => track.enabled = !track.enabled);
                setIsAudioOn(!isAudioOn);
                toast.info(isAudioOn ? 'Microphone muted' : 'Microphone unmuted');
            } else toast.error('No audio track found');
        }
    };

    const handleEndCall = async () => {
        if (callState.callWith && username) {
            try {
                await set(ref(db, `calls/${callState.callWith}`), { from: username, to: callState.callWith, status: 'ended', callId: callState.callId, endedBy: username, timestamp: Date.now() });
            } catch (err) { }
        }
        try {
            await remove(ref(db, `calls/${username}`));
        } catch (err) { }
        cleanupCall(localStream, setLocalStream, currentCall, setCurrentCall, durationIntervalRef, setRemoteStream, setCallDuration, setIsVideoOn, setIsAudioOn, setIsCallConnected);
        onCallEnd();
    };

    const handleAcceptCall = async () => {
        if (callState.callWith && username) {
            try {
                await set(ref(db, `calls/${callState.callWith}`), { from: username, to: callState.callWith, status: 'accepted', callId: callState.callId, timestamp: Date.now() });
            } catch (err) { }
        }
        setCallState(prev => ({ ...prev, isIncomingCall: false, isActiveCall: true }));
        onCallAccept();
    };

    const handleRejectCall = async () => {
        if (callState.callWith && username) {
            try {
                await set(ref(db, `calls/${callState.callWith}`), { from: username, to: callState.callWith, status: 'rejected', callId: callState.callId, timestamp: Date.now() });
            } catch (err) { }
        }
        try {
            await remove(ref(db, `calls/${username}`));
        } catch (err) { }
        cleanupCall(localStream, setLocalStream, currentCall, setCurrentCall, durationIntervalRef, setRemoteStream, setCallDuration, setIsVideoOn, setIsAudioOn, setIsCallConnected);
        onCallReject();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-2xl w-full h-full max-w-6xl mx-auto shadow-2xl flex flex-col`}>
                <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                        {getProfilePhoto(userProfiles, callState.callWith) ? (
                            <img src={getProfilePhoto(userProfiles, callState.callWith)} alt={callState.callWith} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-[#0084ff] flex items-center justify-center text-white font-bold">
                                {callState.callWith?.charAt(0)?.toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h2 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{callState.callWith}</h2>
                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{getCallStatusText(callState, callDuration)}</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 relative bg-black rounded-b-2xl overflow-hidden">
                    {remoteStream && isCallConnected ? (
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <div className="text-center">
                                <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                                    {getProfilePhoto(userProfiles, callState.callWith) ? (
                                        <img src={getProfilePhoto(userProfiles, callState.callWith)} alt={callState.callWith} className="w-20 h-20 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-[#0084ff] flex items-center justify-center text-white text-2xl font-bold">
                                            {callState.callWith?.charAt(0)?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <p className="text-white text-lg">{callState.isActiveCall ? 'Connecting video...' : 'Waiting for call...'}</p>
                            </div>
                        </div>
                    )}
                    {localStream && (
                        <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-900 rounded-lg overflow-hidden shadow-2xl border-2 border-white">
                            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                            {!isVideoOn && <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center"><FaVideoSlash className="text-white text-2xl" /></div>}
                        </div>
                    )}
                </div>
                <div className="p-6 flex justify-center items-center gap-6">
                    {callState.isIncomingCall && !callState.isActiveCall ? (
                        <>
                            <button onClick={handleAcceptCall} className="p-4 bg-green-500 hover:bg-green-600 rounded-full transition-colors shadow-lg"><FaVideo className="text-white text-xl" /></button>
                            <button onClick={handleRejectCall} className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-lg"><FaPhoneSlash className="text-white text-xl" /></button>
                        </>
                    ) : callState.isActiveCall ? (
                        <>
                            <button onClick={toggleVideo} className={`p-4 rounded-full transition-colors shadow-lg ${isVideoOn ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}>
                                {isVideoOn ? <FaVideo className="text-white text-xl" /> : <FaVideoSlash className="text-white text-xl" />}
                            </button>
                            <button onClick={toggleAudio} className={`p-4 rounded-full transition-colors shadow-lg ${isAudioOn ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}>
                                {isAudioOn ? <FaMicrophone className="text-white text-xl" /> : <FaMicrophoneSlash className="text-white text-xl" />}
                            </button>
                            <button onClick={handleEndCall} className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-lg"><FaPhoneSlash className="text-white text-xl" /></button>
                        </>
                    ) : (
                        <button onClick={handleEndCall} className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-lg"><FaPhoneSlash className="text-white text-xl" /></button>
                    )}
                </div>
            </div>
        </div>
    );
}