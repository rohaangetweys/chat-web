import React from 'react';
import ContactItem from './ContactItem';

export default function ContactList({ contacts, activeUser, activeChatType, handleUserClick, handleGroupClick, getProfilePhoto, getLastMessagePreview, formatLastMessageTime }) {
    if (!contacts || contacts.length === 0) {
        return (
            <div className="text-center mt-8 px-4">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <span className="text-2xl">🔍</span>
                </div>
                <p className="text-gray-700 font-medium mb-1">No contacts yet</p>
                <p className="text-sm text-gray-500">Start a conversation or create a group.</p>
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