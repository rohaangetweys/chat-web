'use client';
import React from 'react';
import MediaModal from '@/components/MediaModal';
import VoiceRecorder from '@/components/VoiceRecorder';

export default function ModalsManager({ modalContent, modalType, showVoiceRecorder, setShowVoiceRecorder, onVoiceComplete, closeMediaModal }) {
    return (
        <>
            {showVoiceRecorder && <VoiceRecorder onRecordingComplete={onVoiceComplete} onClose={() => setShowVoiceRecorder(false)} />}
            <MediaModal isOpen={!!modalContent} onClose={closeMediaModal} content={modalContent} type={modalType} />
        </>
    );
}