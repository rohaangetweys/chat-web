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

export function getAvailableUsers(users, username) {
    return users.filter(u => u !== username);
}

export function getProfilePhoto(username, userProfiles) {
    return userProfiles[username]?.profilePhoto || null;
}

export function getDisplayName(username) {
    return username;
}

export function toggleUserSelection(selectedUsers, user) {
    return selectedUsers.includes(user) 
        ? selectedUsers.filter(u => u !== user) 
        : [...selectedUsers, user];
}

export function filterUsersByQuery(users, searchQuery) {
    if (searchQuery.trim() === '') {
        return users;
    }
    const q = searchQuery.toLowerCase();
    return users.filter(user => user.toLowerCase().includes(q));
}

export function filterGroupsByQuery(groups, searchQuery) {
    if (searchQuery.trim() === '') {
        return groups;
    }
    const q = searchQuery.toLowerCase();
    return groups.filter(group => group.name.toLowerCase().includes(q));
}

export function prepareContacts(availableUsers, groups, lastMessages, unreadCounts, onlineStatus) {
    const allContacts = [];

    availableUsers.forEach(user => {
        const lastMessage = lastMessages[user];
        const timestamp = lastMessage?.timestamp || 0;
        const unreadCount = unreadCounts[user] || 0;

        allContacts.push({
            type: 'user',
            id: user,
            name: getDisplayName(user),
            username: user,
            lastMessage: lastMessage,
            timestamp: timestamp,
            unreadCount: unreadCount,
            online: onlineStatus[user]?.online || false
        });
    });

    groups.forEach(group => {
        const lastMessage = lastMessages[group.id];
        const timestamp = lastMessage?.timestamp || 0;
        const unreadCount = unreadCounts[group.id] || 0;

        allContacts.push({
            type: 'group',
            id: group.id,
            name: group.name,
            lastMessage: lastMessage,
            timestamp: timestamp,
            unreadCount: unreadCount
        });
    });

    return allContacts.sort((a, b) => {
        if (a.timestamp && b.timestamp) {
            return b.timestamp - a.timestamp;
        }
        if (a.timestamp && !b.timestamp) return -1;
        if (!a.timestamp && b.timestamp) return 1;

        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

        return a.name.localeCompare(b.name);
    });
}

export function filterContacts(sortedContacts, activeFilter, searchQuery, filteredUsers, filteredGroups, lastMessages, unreadCounts, onlineStatus) {
    if (searchQuery.trim() !== '') {
        const searchResults = [];

        filteredGroups.forEach((group) => {
            searchResults.push({
                type: 'group',
                id: group.id,
                name: group.name,
                lastMessage: lastMessages[group.id],
                unreadCount: unreadCounts[group.id] || 0
            });
        });

        filteredUsers.forEach((user) => {
            searchResults.push({
                type: 'user',
                id: user,
                name: getDisplayName(user),
                username: user,
                lastMessage: lastMessages[user],
                unreadCount: unreadCounts[user] || 0,
                online: onlineStatus[user]?.online || false
            });
        });

        return searchResults;
    }

    let filtered = sortedContacts;

    switch (activeFilter) {
        case 'unread':
            filtered = sortedContacts.filter(contact => contact.unreadCount > 0);
            break;
        case 'groups':
            filtered = sortedContacts.filter(contact => contact.type === 'group');
            break;
        case 'all':
        default:
            filtered = sortedContacts;
    }

    return filtered;
}