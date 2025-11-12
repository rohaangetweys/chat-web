'use client';
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';
import { HiOutlineUserGroup } from 'react-icons/hi2';
import { getRandomColor } from '../../utils/sidebar';

export default function ContactList({ contacts, activeUser, activeChatType, handleUserClick, handleGroupClick, getProfilePhoto, getLastMessagePreview, formatLastMessageTime }) {
    const { isDark } = useTheme();

    if (!contacts || contacts.length === 0) {
        return (
            <div className="text-center mt-8 px-4">
                <div className={`w-14 h-14 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner`}>
                    <span className="text-2xl">🔍</span>
                </div>
                <p className={`font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No contacts yet</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Start a conversation or create a group.</p>
            </div>
        );
    }

    return (
        <div>
            {contacts.map(contact => (
                <ContactItem key={`${contact.type}-${contact.id}`} contact={contact} activeUser={activeUser} activeChatType={activeChatType} onUserClick={handleUserClick} onGroupClick={handleGroupClick} getProfilePhoto={getProfilePhoto} getLastMessagePreview={getLastMessagePreview} formatLastMessageTime={formatLastMessageTime} />
            ))}
        </div>
    );
}


function ContactItem({ contact, activeUser, activeChatType, onUserClick, onGroupClick, getProfilePhoto, getLastMessagePreview, formatLastMessageTime }) {
    const isActive = contact.id === activeUser && (
        (contact.type === 'user' && activeChatType === 'individual') ||
        (contact.type === 'group' && activeChatType === 'group')
    );
    const hasUnread = contact.unreadCount > 0;
    const profilePhoto = contact.type === 'user' ? getProfilePhoto(contact.id) : null;
    const { isDark } = useTheme();

    const handleClick = () => {
        if (contact.type === 'user') {
            onUserClick(contact.id);
        } else {
            onGroupClick(contact.id);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`flex items-center gap-2 p-2 cursor-pointer border-b ${isDark ? 'border-gray-600' : 'border-gray-100'
                } transition-colors ${isActive
                    ? isDark ? 'bg-gray-700' : 'bg-gray-200'
                    : hasUnread
                        ? isDark ? 'bg-teal-900 hover:bg-gray-700' : 'bg-teal-50 hover:bg-gray-100'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
        >
            <div className="relative">
                {contact.type === 'user' ? (
                    profilePhoto ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#0084ff]">
                            <Image src={profilePhoto} alt={contact.name} width={40} height={40} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <h2 className="w-10 h-10 rounded-full flex items-center justify-center text-lg text-white" style={{ backgroundColor: getRandomColor() }}>
                            {contact.name.slice(0, 1).toUpperCase()}
                        </h2>
                    )
                ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg text-white bg-indigo-500">
                        <HiOutlineUserGroup size={20} />
                    </div>
                )}

                {contact.type === 'user' && contact.online && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                    <h3 className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {contact.name}
                    </h3>
                    {contact.lastMessage && (
                        <span className={`text-xs whitespace-nowrap ml-1 ${hasUnread
                            ? 'text-[#0084ff] font-semibold'
                            : isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                            {formatLastMessageTime(contact.lastMessage.timestamp)}
                        </span>
                    )}
                </div>

                <div className="flex justify-between items-center">
                    <p className={`text-xs truncate ${hasUnread
                        ? isDark ? 'text-gray-200 font-medium' : 'text-gray-800 font-medium'
                        : isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        {getLastMessagePreview(contact.id)}
                    </p>

                    {hasUnread && (
                        <div className="shrink-0 ml-1">
                            <div className="bg-[#0084ff] text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 font-bold">
                                {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}