'use client';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';

export default function GroupModal({ availableUsers, onlineStatus, groupName, setGroupName, selectedUsers, toggleUserSelection, closeGroupModal, handleCreateGroup }) {
    const { isDark } = useTheme();

    return (
        <div className="fixed inset-0 bg-black/85 bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-sm mx-auto shadow-2xl`}>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-5`}>Create Group Chat</h3>

                <div className="mb-4">
                    <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Group Name</label>
                    <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Enter group name" className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-[#0084ff] border-gray-600' : 'bg-gray-100 text-gray-800 placeholder-gray-400 focus:ring-[#0084ff] border-gray-200'} focus:outline-none focus:ring-2 border`} />
                </div>

                <div className="mb-6">
                    <label className={`block text-sm mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Select Users</label>
                    <div className={`max-h-48 overflow-y-auto rounded-lg border p-2 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        {availableUsers.map((user) => (
                            <div key={user} className={`flex items-center gap-3 p-2 rounded cursor-pointer ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`} onClick={() => toggleUserSelection(user)}>
                                <input type="checkbox" id={`group-user-${user}`} checked={selectedUsers.includes(user)} readOnly className={`w-4 h-4 text-[#0084ff] ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} rounded focus:ring-[#0084ff] focus:ring-2`} />
                                <label htmlFor={`group-user-${user}`} className={`cursor-pointer flex-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{user}</label>
                                {onlineStatus[user]?.online && (<div className="w-2 h-2 bg-green-500 rounded-full" title="Online"></div>)}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <button onClick={closeGroupModal} className={`px-4 py-2 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} rounded-lg transition-colors font-medium`}>Cancel</button>
                    <button onClick={handleCreateGroup} disabled={!groupName.trim() || selectedUsers.length === 0} className="px-4 py-2 bg-[#0084ff] text-white rounded-lg hover:bg-[#00b884] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md">Create Group</button>
                </div>
            </div>
        </div>
    );
}