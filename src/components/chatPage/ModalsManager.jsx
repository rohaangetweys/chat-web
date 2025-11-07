'use client';
import React from 'react';
import MediaModal from '@/components/MediaModal';
import VoiceRecorder from '@/components/VoiceRecorder';
import FileTypeModal from '@/components/FileTypeModal';

export default function ModalsManager({ modalContent, modalType, showFileTypeModal, setShowFileTypeModal, showVoiceRecorder, setShowVoiceRecorder, onFileTypeSelect, onVoiceComplete, closeMediaModal }) {
    return (
        <>
            {showFileTypeModal && <FileTypeModal onClose={() => setShowFileTypeModal(false)} onFileTypeSelect={onFileTypeSelect} />}
            {showVoiceRecorder && <VoiceRecorder onRecordingComplete={onVoiceComplete} onClose={() => setShowVoiceRecorder(false)} />}
            <MediaModal isOpen={!!modalContent} onClose={closeMediaModal} content={modalContent} type={modalType} />
        </>
    );
}