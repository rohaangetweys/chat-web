'use client'
import React from 'react';
import { FaImage, FaVideo, FaFile, FaTimes } from 'react-icons/fa';

export default function FileTypeModal({ onClose, onFileTypeSelect }) {
    const options = [
        {
            type: 'image',
            label: 'Image',
            icon: FaImage,
            description: 'Upload photos and images',
            color: 'text-green-400'
        },
        {
            type: 'video',
            label: 'Video',
            icon: FaVideo,
            description: 'Upload video files',
            color: 'text-blue-400'
        },
        {
            type: 'document',
            label: 'Document',
            icon: FaFile,
            description: 'Upload PDF, Word, and other documents',
            color: 'text-purple-400'
        }
    ];

    const handleOptionClick = (fileType) => {
        onFileTypeSelect(fileType);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#2a3942] rounded-lg shadow-xl max-w-sm w-full mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#374248]">
                    <h3 className="text-lg font-semibold text-white">Choose File Type</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-[#374248] transition-colors text-gray-300 hover:text-white"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                {/* Options */}
                <div className="p-4 space-y-2">
                    {options.map((option) => {
                        const IconComponent = option.icon;
                        return (
                            <button
                                key={option.type}
                                onClick={() => handleOptionClick(option.type)}
                                className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-[#374248] transition-colors text-left group"
                            >
                                <div className={`p-3 rounded-full bg-[#202c33] group-hover:bg-[#00a884] transition-colors`}>
                                    <IconComponent className={`${option.color} group-hover:text-white transition-colors`} size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">{option.label}</p>
                                    <p className="text-gray-400 text-sm">{option.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#374248]">
                    <button
                        onClick={onClose}
                        className="w-full py-2 px-4 bg-[#374248] text-white rounded-lg hover:bg-[#45535a] transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}