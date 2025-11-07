import React from 'react';
import { FaPaperPlane, FaMicrophone } from 'react-icons/fa';
import { GoPaperclip } from 'react-icons/go';

export default function ChatInput({ activeUser, uploading, fileInputRef, onPaperClipClick, onShowVoiceRecorder, onSendMessage, message, setMessage, onKeyDown, activeChatType }) {
    return (
        <div className="p-4 bg-white border-t border-gray-200 shadow-sm flex items-center">
            <div className="flex items-center gap-2 w-full">
                <button onClick={onPaperClipClick} disabled={!activeUser || uploading} className={`p-3 rounded-full transition-all ${!activeUser || uploading ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-[#00a884] hover:bg-gray-100'}`} title="Upload file">
                    <GoPaperclip size={20} />
                </button>

                <button onClick={onShowVoiceRecorder} disabled={!activeUser || uploading} className={`p-3 rounded-full transition-all ${!activeUser || uploading ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-[#00a884] hover:bg-gray-100'}`} title="Record voice message">
                    <FaMicrophone size={18} />
                </button>

                <div className="flex-1 relative">
                    <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={activeUser ? (activeChatType === 'group' ? `Message group...` : `Message ${activeUser}...`) : 'Select a contact to start chatting'} className="w-full p-3 px-4 rounded-full bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] border-none shadow-inner" onKeyDown={onKeyDown} disabled={!activeUser || uploading} />
                </div>

                <button onClick={onSendMessage} disabled={!activeUser || uploading || !message.trim()} className={`p-3 rounded-full transition-all ${!activeUser || uploading || !message.trim() ? 'text-gray-400 cursor-not-allowed bg-gray-100' : 'text-white bg-[#00a884] hover:bg-[#00b884] shadow-md'}`}>
                    <FaPaperPlane size={16} />
                </button>
            </div>
        </div>
    );
}