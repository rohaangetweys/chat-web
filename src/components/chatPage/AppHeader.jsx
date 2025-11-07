'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { MdOutlineNotificationsActive } from 'react-icons/md';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import Image from 'next/image';

export default function AppHeader({ user, username, handleLogout }) {
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const profileDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="px-6 border bg-white border-gray-300 w-full h-20 rounded-3xl flex items-center justify-between mb-3">
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#00a884', color: 'white', border: '1px solid #00a884' } }} />

            <div className="flex items-center gap-3">
                <div className="bg-[#00a884] text-white px-6 h-10 rounded-xl flex items-center justify-center opacity-50 text-xl font-semibold">
                    <h1 className="text-2xl font-bold tracking-wide">Chat App</h1>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="p-2 rounded-full text-[#00a884] hover:bg-gray-200 transition-colors">
                    <MdOutlineNotificationsActive className="text-[#00a884] text-[26px] hover:bg-gray-200 transition-colors" />
                </div>

                <div className="relative" ref={profileDropdownRef}>
                    <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="p-2 rounded-full text-[#00a884] hover:bg-gray-200 transition-colors flex items-center gap-2">
                        {user?.photoURL ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#00a884]"><Image src={user.photoURL} alt="Profile" width={32} height={32} className="w-full h-full object-cover" /></div>
                        ) : (
                            <FaUserCircle className="text-[#00a884] text-[26px]" />
                        )}
                        <span className="text-sm font-medium hidden md:block">{username}</span>
                    </button>

                    {showProfileDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                                <p className="font-medium">Hello, {username}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                            <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"><FaSignOutAlt className="mr-2 text-gray-500" />Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}