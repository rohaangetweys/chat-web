'use client'
import React, { useEffect } from 'react';
import { FaTimes, FaDownload } from 'react-icons/fa';

export default function MediaModal({ isOpen, onClose, content, type }) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="relative max-w-4xl max-h-full w-full">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
                >
                    <FaTimes size={24} />
                </button>

                {/* Content */}
                <div className="bg-transparent rounded-lg overflow-hidden">
                    {type === 'image' ? (
                        <img
                            src={content}
                            alt="Full size preview"
                            className="max-w-full max-h-[80vh] w-auto h-auto object-contain mx-auto"
                        />
                    ) : type === 'video' ? (
                        <video
                            controls
                            autoPlay
                            className="max-w-full max-h-[80vh] w-auto h-auto mx-auto"
                        >
                            <source src={content} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    ) : null}
                </div>

                {/* Background Click Area */}
                <div className="absolute inset-0 -z-10" onClick={onClose} />
            </div>
        </div>
    );
}