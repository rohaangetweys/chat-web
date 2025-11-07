'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';

export default function AppHeader({ user, username, handleLogout }) {
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const profileDropdownRef = useRef(null);
    const { isDark, toggleTheme } = useTheme();

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
        <header className={`px-6 border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} w-full h-20 rounded-3xl flex items-center justify-between mb-3`}>
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#00a884', color: 'white', border: '1px solid #00a884' } }} />

            <div className="flex items-center gap-3">
                <div className="bg-[#00a884] text-white px-6 h-10 rounded-xl flex items-center justify-center opacity-50 text-xl font-semibold">
                    <h1 className="text-2xl font-bold tracking-wide">Chat App</h1>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-full transition-colors ${isDark
                            ? 'text-yellow-400 hover:bg-gray-700'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDark ? (
                        <MdLightMode className="text-[26px]" />
                    ) : (
                        <MdDarkMode className="text-[26px]" />
                    )}
                </button>

                <div className="relative" ref={profileDropdownRef}>
                    <button
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        className={`p-2 rounded-full text-[#00a884] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                            } transition-colors flex items-center gap-2`}
                    >
                        {user?.photoURL ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#00a884]">
                                <Image
                                    src={user.photoURL}
                                    alt="Profile"
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <FaUserCircle className="text-[#00a884] text-[26px]" />
                        )}
                        <span className="text-sm font-medium hidden md:block">{username}</span>
                    </button>

                    {showProfileDropdown && (
                        <div className={`absolute right-0 mt-2 w-48 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                            } rounded-md shadow-lg py-1 z-50 border`}>
                            <div className={`px-4 py-2 text-sm ${isDark ? 'text-gray-300 border-gray-600' : 'text-gray-700 border-gray-100'
                                } border-b`}>
                                <p className="font-medium">Hello, {username}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className={`flex items-center w-full px-4 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                                    } transition-colors`}
                            >
                                <FaSignOutAlt className="mr-2 text-gray-500" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}