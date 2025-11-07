// File: components/Sidebar/SidebarSearch.jsx
import React from 'react';
import { FaSearch, FaUsers } from 'react-icons/fa';

export default function SidebarSearch({ searchQuery, onSearchChange, clearSearch, openGroupModal }) {
    return (
        <div className="p-4 bg-white flex items-center justify-between gap-2">
            <div className="relative w-full">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder={"Search contacts..."} className="w-full p-3 pl-12 rounded-full bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] border-none shadow-inner" />
                {searchQuery && (
                    <button onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700">✕</button>
                )}
            </div>
            <button onClick={openGroupModal} className="p-2 rounded-full text-[#00a884] hover:bg-gray-200 transition-colors" title="Create Group Chat">
                <FaUsers size={27} />
            </button>
        </div>
    );
}