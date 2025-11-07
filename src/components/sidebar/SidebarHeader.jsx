'use client';
import React from 'react';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';

export default function SidebarHeader({ username, getProfilePhoto }) {
    const { isDark } = useTheme();

    return (
        <div className={`p-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} flex items-center gap-3 border-b shadow-sm`}>
            {getProfilePhoto(username) ? (
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#00a884]">
                    <Image src={getProfilePhoto(username)} alt={username} width={40} height={40} className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="w-10 h-10 rounded-full bg-[#00a884] flex justify-center items-center text-white font-semibold shadow-md">
                    {username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
            )}

            <div className="flex-1 min-w-0">
                <h2 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{username}</h2>
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Online
                </p>
            </div>
        </div>
    );
}