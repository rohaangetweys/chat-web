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

export function getLastMessagePreview(targetId, lastMessages, groups, blockedUsers = []) {
    if (blockedUsers.includes(targetId)) return 'User is blocked';
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

export function getAvailableUsers(users, username, blockedUsers = []) {
    return users.filter(u => u !== username && !blockedUsers.includes(u));
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

export function filterUsersByQuery(users, searchQuery, blockedUsers = []) {
    if (searchQuery.trim() === '') {
        return users.filter(u => !blockedUsers.includes(u));
    }
    const q = searchQuery.toLowerCase();
    return users.filter(user => user.toLowerCase().includes(q) && !blockedUsers.includes(user));
}

export function filterGroupsByQuery(groups, searchQuery) {
    if (searchQuery.trim() === '') {
        return groups;
    }
    const q = searchQuery.toLowerCase();
    return groups.filter(group => group.name.toLowerCase().includes(q));
}

export function prepareContacts(availableUsers, groups, lastMessages, unreadCounts, onlineStatus, blockedUsers = []) {
    const allContacts = [];

    availableUsers
        .filter(user => !blockedUsers.includes(user))
        .forEach(user => {
            const lastMessage = lastMessages[user];
            const timestamp = lastMessage?.timestamp || 0;
            const unreadCount = unreadCounts[user] || 0;

            allContacts.push({
                type: 'user',
                id: user,
                name: getDisplayName(user),
                username: user,
                lastMessage,
                timestamp,
                unreadCount,
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
            lastMessage,
            timestamp,
            unreadCount
        });
    });

    return allContacts.sort((a, b) => {
        if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
        if (a.timestamp && !b.timestamp) return -1;
        if (!a.timestamp && b.timestamp) return 1;
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        return a.name.localeCompare(b.name);
    });
}

export function filterContacts(sortedContacts, activeFilter, searchQuery, filteredUsers, filteredGroups, lastMessages, unreadCounts, onlineStatus, blockedUsers = []) {
    if (searchQuery.trim() !== '') {
        const searchResults = [];

        if (activeFilter !== 'blocked') {
            filteredGroups.forEach(group => {
                searchResults.push({
                    type: 'group',
                    id: group.id,
                    name: group.name,
                    lastMessage: lastMessages[group.id],
                    unreadCount: unreadCounts[group.id] || 0
                });
            });

            const searchableUsers = filteredUsers.filter(user => !blockedUsers.includes(user));
            searchableUsers.forEach(user => {
                searchResults.push({
                    type: 'user',
                    id: user,
                    name: getDisplayName(user),
                    username: user,
                    lastMessage: lastMessages[user],
                    unreadCount: unreadCounts[user] || 0,
                    online: onlineStatus[user]?.online || false,
                    timestamp: lastMessages[user]?.timestamp || 0
                });
            });
        } else {
            const blockedSearchResults = filteredUsers.filter(user => blockedUsers.includes(user));
            blockedSearchResults.forEach(user => {
                searchResults.push({
                    type: 'blocked',
                    id: user,
                    name: getDisplayName(user),
                    username: user,
                    lastMessage: null,
                    unreadCount: 0,
                    online: false,
                    timestamp: 0
                });
            });
        }

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
        case 'blocked':
            filtered = blockedUsers.map(user => ({
                type: 'blocked',
                id: user,
                name: getDisplayName(user),
                username: user,
                lastMessage: null,
                unreadCount: 0,
                online: false,
                timestamp: 0
            })).sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'all':
        default:
            filtered = sortedContacts.filter(c => !blockedUsers.includes(c.id));
    }

    return filtered;
}

export function isUserBlocked(userId, blockedUsers) {
    return blockedUsers.includes(userId);
}

export function getAvailableNonBlockedUsers(users, username, blockedUsers) {
    return users.filter(u => u !== username && !blockedUsers.includes(u));
}
