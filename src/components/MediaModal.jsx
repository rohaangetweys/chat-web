'use client'
import React, { useEffect } from 'react';
import { FaTimes, FaDownload } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function MediaModal({ isOpen, onClose, content, type }) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
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
        if (e.target === e.currentTarget) onClose();
    };

    const handleDownload = async () => {
        try {
            const fileName =
                type === 'image'
                    ? 'image_' + Date.now() + '.jpg'
                    : 'video_' + Date.now() + '.mp4';

            const response = await fetch(content);
            const blob = await response.blob();

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            toast.success('Download started');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Download failed');
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/85 bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="relative max-w-4xl max-h-full w-full flex flex-col items-center">
                <div className="absolute -top-12 right-0 flex items-center gap-4">
                    <button
                        onClick={handleDownload}
                        className="text-white hover:text-gray-300 transition-colors bg-[#00a884] p-2 rounded-full shadow-lg"
                        title="Download"
                    >
                        <FaDownload size={18} />
                    </button>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-300 transition-colors bg-gray-600 p-2 rounded-full shadow-lg"
                        title="Close"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                <div className="bg-transparent rounded-lg overflow-hidden">
                    {type === 'image' ? (
                        <img
                            src={content}
                            alt="Full preview"
                            className="max-w-full max-h-[80vh] w-auto h-auto object-contain mx-auto rounded-lg shadow-2xl"
                        />
                    ) : type === 'video' ? (
                        <video
                            controls
                            autoPlay
                            className="max-w-full max-h-[80vh] w-auto h-auto mx-auto rounded-lg shadow-2xl"
                        >
                            <source src={content} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    ) : null}
                </div>

                <div className="absolute inset-0 -z-10" onClick={onClose} />
            </div>
        </div>
    );
}