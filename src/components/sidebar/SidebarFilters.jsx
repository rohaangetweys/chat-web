'use client';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';

export default function SidebarFilters({ activeFilter, setActiveFilter, sortedContacts }) {
    const { isDark } = useTheme();

    return (
        <div className={`flex px-4 gap-2 pb-2 border-b ${isDark ? 'border-gray-600' : 'border-gray-100'}`}>
            <button onClick={() => setActiveFilter('all')} className={`h-9 px-3 text-sm font-medium transition-colors rounded-full ${activeFilter === 'all' ? 'bg-[#00a884] text-white shadow-md' : isDark ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}>All</button>
            <button onClick={() => setActiveFilter('unread')} className={`h-9 px-3 rounded-full text-sm font-medium transition-colors relative ${activeFilter === 'unread' ? 'bg-[#00a884] text-white shadow-md' : isDark ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}>Unread{sortedContacts.some(contact => contact.unreadCount > 0) && (<span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>)}</button>
            <button onClick={() => setActiveFilter('groups')} className={`h-9 px-3 rounded-full text-sm font-medium transition-colors ${activeFilter === 'groups' ? 'bg-[#00a884] text-white shadow-md' : isDark ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}>Groups</button>
        </div>
    );
}