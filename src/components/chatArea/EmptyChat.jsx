import React from 'react';

export default function EmptyChat() {
    return (
        <div className="text-center mt-20">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <span className="text-4xl text-gray-400">💬</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to Chat</h3>
            <p className="text-gray-500">Select a contact from the sidebar to start a conversation</p>
        </div>
    );
}