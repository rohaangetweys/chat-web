export const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getProfilePhoto = (userProfiles, username) => {
    return userProfiles?.[username]?.profilePhoto || null;
};

export const getCallStatusText = (callState, callDuration) => {
    if (callState.isIncomingCall && !callState.isActiveCall) return 'Incoming video call...';
    if (callState.isOutgoingCall && !callState.isActiveCall) return 'Calling...';
    if (callState.isActiveCall) return `Call duration: ${formatDuration(callDuration)}`;
    return '';
};

export const handleMediaError = (error, mediaType = 'camera') => {
    if (mediaType === 'audio') return handleAudioError(error);
    
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        return 'Camera not found. Please check your camera connection.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        return 'Camera is already in use by another application.';
    } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        return 'Camera constraints cannot be satisfied. Please try different settings.';
    } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return 'Camera permission denied. Please allow camera access.';
    } else {
        return 'Cannot access camera: ' + error.message;
    }
};

export const startCallTimer = (setCallDuration, durationIntervalRef) => {
    durationIntervalRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000);
};

export const cleanupCall = (
    localStream,
    setLocalStream,
    currentCall,
    setCurrentCall,
    durationIntervalRef,
    setRemoteStream,
    setCallDuration,
    setIsVideoOn,
    setIsAudioOn,
    setIsCallConnected
) => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
    }
    if (currentCall) {
        currentCall.close();
        setCurrentCall(null);
    }
    if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
    }
    setRemoteStream(null);
    setCallDuration(0);
    setIsVideoOn(true);
    setIsAudioOn(true);
    setIsCallConnected(false);
};

export const handleAudioError = (error) => {
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        return 'Microphone not found. Please check your microphone connection.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        return 'Microphone is already in use by another application.';
    } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return 'Microphone permission denied. Please allow microphone access.';
    } else {
        return 'Cannot access microphone: ' + error.message;
    }
};