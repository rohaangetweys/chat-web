'use client';
import { logout } from '@/lib/firebase';
import React, { useState } from 'react'
import { FaSearch } from 'react-icons/fa';

export default function Sidebar({ username, users, setUsers, activeUser, setActiveUser }) {
    const handleLogout = async () => {
        const res = await logout();
        if (res?.success) {
            toast.success("Logged out");
            router.push("/login");
        } else {
            toast.error("Logout failed");
            console.error(res);
        }
    };
    

    return (
        <div className="w-1/4 bg-[#202c33] border-r border-[#374248] flex flex-col h-screen">
            {/* User Header */}
            <div className="p-3 bg-[#202c33] flex items-center gap-3 border-b border-[#374248]">
                <div className="w-10 h-10 rounded-full bg-[#00a884] flex justify-center items-center text-white font-semibold">
                    {username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-white truncate">{username}</h2>
                    <p className="text-xs text-gray-400 truncate">Online</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="bg-[#2a3942] text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-[#374248] transition text-sm border border-[#374248]"
                    title="Logout"
                >
                    Logout
                </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 bg-[#202c33]">
                <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        onChange={(e) => {
                            const q = e.target.value.toLowerCase();
                            if (!q) {
                                setUsers((prev) => prev.slice());
                            } else {
                                setUsers((prev) =>
                                    prev.filter((u) => u.toLowerCase().includes(q))
                                );
                            }
                        }}
                        className="w-full p-3 pl-12 rounded-lg bg-[#2a3942] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00a884] border-none"
                    />
                </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto bg-[#111b21]">
                {users.length === 0 ? (
                    <p className="p-4 text-center text-gray-400">No users found</p>
                ) : (
                    users
                        .filter((u) => u !== username)
                        .map((u, i) => (
                            <div
                                key={u + i}
                                onClick={() => setActiveUser(u)}
                                className={`flex items-center gap-3 p-3 cursor-pointer border-b border-[#374248] hover:bg-[#2a3942] transition-colors ${u === activeUser ? "bg-[#2a3942]" : ""
                                    }`}
                            >
                                <div className="relative">
                                    <img
                                        src={`https://i.pravatar.cc/150?u=${u}`}
                                        alt={u}
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21]"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white truncate">{u}</h3>
                                    <p className="text-sm text-gray-400 truncate">
                                        Tap to start conversation
                                    </p>
                                </div>
                                <span className="text-xs text-gray-400">●</span>
                            </div>
                        ))
                )}
            </div>
        </div>
    )
}
