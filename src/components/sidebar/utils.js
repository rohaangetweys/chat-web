export function getRandomColor() {
    const r = Math.floor(Math.random() * 100) + 150;
    const g = Math.floor(Math.random() * 100) + 150;
    const b = Math.floor(Math.random() * 100) + 150;
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function formatLastMessageTime(timestamp) {
    if (!timestamp) return '';
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - messageDate;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 24) {
        return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
        return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
        return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

export function getLastMessagePreview(targetId, lastMessages, groups) {
    const lastMessage = lastMessages[targetId];
    if (!lastMessage) return 'No messages yet';

    let messageContent = '';
    switch (lastMessage.type) {
        case 'image':
            messageContent = '📷 Image';
            break;
        case 'video':
            messageContent = '🎥 Video';
            break;
        case 'audio':
            messageContent = '🎤 Voice message';
            break;
        case 'file':
            messageContent = `📄 ${lastMessage.fileName || 'File'}`;
            break;
        default:
            messageContent = lastMessage.message || 'Message';
    }

    const isGroup = groups.some(g => g.id === targetId);
    if (isGroup && lastMessage.username) {
        return `${lastMessage.username}: ${messageContent}`;
    }

    return messageContent;
}
