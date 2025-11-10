'use client';
import React from 'react';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';
import { FaSearch, FaUsers } from 'react-icons/fa';

export default function SidebarHeader({ username, getProfilePhoto, searchQuery, onSearchChange, clearSearch, openGroupModal, activeFilter, setActiveFilter, sortedContacts }) {
    const { isDark } = useTheme();

    const totalUnreadCount = sortedContacts.reduce((total, contact) => total + (contact.unreadCount || 0), 0);

    return (
        <>
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

            <div className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} flex items-center justify-between gap-2`}>
                <div className="relative w-full">
                    <FaSearch className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                    <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder={"Search contacts..."} className={`w-full p-3 pl-12 rounded-full ${isDark ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-[#00a884]' : 'bg-gray-100 text-gray-800 placeholder-gray-500 focus:ring-[#00a884]'} focus:outline-none focus:ring-2 border-none shadow-inner`} />
                    {searchQuery && (
                        <button onClick={clearSearch} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-700'}`}>✕</button>
                    )}
                </div>
                <button onClick={openGroupModal} className={`p-2 rounded-full text-[#00a884] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`} title="Create Group Chat">
                    <FaUsers size={27} />
                </button>
            </div>

            <div className={`flex px-4 gap-2 pb-2 border-b ${isDark ? 'border-gray-600' : 'border-gray-100'}`}>
                <button
                    onClick={() => setActiveFilter('all')}
                    className={`h-9 px-3 text-sm font-medium transition-colors rounded-full ${activeFilter === 'all'
                        ? 'bg-[#00a884] text-white shadow-md'
                        : isDark
                            ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setActiveFilter('unread')}
                    className={`h-9 px-3 rounded-full text-sm font-medium transition-colors relative ${activeFilter === 'unread'
                        ? 'bg-[#00a884] text-white shadow-md'
                        : isDark
                            ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                        }`}
                >
                    Unread
                    {totalUnreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm">
                            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveFilter('groups')}
                    className={`h-9 px-3 rounded-full text-sm font-medium transition-colors ${activeFilter === 'groups'
                        ? 'bg-[#00a884] text-white shadow-md'
                        : isDark
                            ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                        }`}
                >
                    Groups
                </button>
            </div>
        </>
    );
}