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
            color: 'text-green-500'
        },
        {
            type: 'video',
            label: 'Video',
            icon: FaVideo,
            description: 'Upload video files',
            color: 'text-blue-500'
        },
        {
            type: 'document',
            label: 'Document',
            icon: FaFile,
            description: 'Upload PDF, Word, and other documents',
            color: 'text-purple-500'
        }
    ];

    const handleOptionClick = (fileType) => {
        onFileTypeSelect(fileType);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Choose File Type</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
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
                                className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors text-left group border border-transparent hover:border-gray-200"
                            >
                                <div className={`p-3 rounded-full bg-gray-100 group-hover:bg-[#00a884] transition-colors`}>
                                    <IconComponent className={`${option.color} group-hover:text-white transition-colors`} size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-800 font-medium">{option.label}</p>
                                    <p className="text-gray-500 text-sm">{option.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}