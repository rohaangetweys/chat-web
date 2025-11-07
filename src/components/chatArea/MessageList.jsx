import React from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({ chat, username, getProfilePhoto, onOpenMedia, activeChatType }) {
    return (
        <>
            {chat.map((msg, i) => (
                <MessageBubble key={msg.id || i} msg={msg} index={i} username={username} getProfilePhoto={getProfilePhoto} onOpenMedia={onOpenMedia} activeChatType={activeChatType} />
            ))}
        </>
    );
}