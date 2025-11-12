'use client';
import React, { useRef, useState, useEffect } from 'react';
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
        <header className={`px-4 border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} w-full h-16 rounded-b-xl flex items-center justify-between mb-2`}>

            <div className="flex items-center gap-2">
                <div className="bg-[#0084ff] text-white px-4 h-8 rounded-lg flex items-center justify-center">
                    <h1 className="text-xl font-bold tracking-wide">Chat App</h1>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={toggleTheme}
                    className={`p-1.5 rounded-full transition-colors ${isDark
                        ? 'text-yellow-400 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDark ? (
                        <MdLightMode className="text-[20px]" />
                    ) : (
                        <MdDarkMode className="text-[20px]" />
                    )}
                </button>

                <div className="relative" ref={profileDropdownRef}>
                    <button
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        className={`p-1.5 rounded-full text-[#0084ff] ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                            } transition-colors flex items-center gap-1.5`}
                    >
                        {user?.photoURL ? (
                            <div className="w-7 h-7 rounded-full overflow-hidden border border-[#0084ff]">
                                <Image
                                    src={user.photoURL}
                                    alt="Profile"
                                    width={28}
                                    height={28}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <FaUserCircle className="text-[#0084ff] text-[20px]" />
                        )}
                        <span className="text-xs font-medium hidden md:block">{username}</span>
                    </button>

                    {showProfileDropdown && (
                        <div className={`absolute right-0 mt-1 w-40 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                            } rounded-md shadow-lg py-1 z-50 border`}>
                            <div className={`px-3 py-1.5 text-xs ${isDark ? 'text-gray-300 border-gray-600' : 'text-gray-700 border-gray-100'
                                } border-b`}>
                                <p className="font-medium">Hello, {username}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className={`flex items-center w-full px-3 py-1.5 text-xs ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                                    } transition-colors`}
                            >
                                <FaSignOutAlt className="mr-1.5 text-gray-500 text-xs" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}