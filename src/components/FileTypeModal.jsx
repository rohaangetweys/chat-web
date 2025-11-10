'use client'
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { FaImage, FaVideo, FaFile, FaTimes } from 'react-icons/fa';

export default function FileTypeModal({ onClose, onFileTypeSelect }) {
    const { isDark } = useTheme();
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
        <div className="fixed inset-0 bg-black/85 bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl max-w-sm w-full mx-auto`}>
                <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Choose File Type</h3>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'} transition-colors`}
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                <div className="p-4 space-y-2">
                    {options.map((option) => {
                        const IconComponent = option.icon;
                        return (
                            <button
                                key={option.type}
                                onClick={() => handleOptionClick(option.type)}
                                className={`w-full flex items-center gap-4 p-4 rounded-lg ${isDark ? 'hover:bg-gray-700 border-transparent hover:border-gray-600' : 'hover:bg-gray-50 border-transparent hover:border-gray-200'} transition-colors text-left group border`}
                            >
                                <div className={`p-3 rounded-full ${isDark ? 'bg-gray-600 group-hover:bg-[#0084ff]' : 'bg-gray-100 group-hover:bg-[#0084ff]'} transition-colors`}>
                                    <IconComponent className={`${option.color} group-hover:text-white transition-colors`} size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className={`${isDark ? 'text-white' : 'text-gray-800'} font-medium`}>{option.label}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{option.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className={`p-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <button
                        onClick={onClose}
                        className={`w-full py-3 px-4 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-lg transition-colors font-medium`}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}