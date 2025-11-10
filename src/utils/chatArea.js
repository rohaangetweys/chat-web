export function getFileIcon(fileName, format) {
  const fileExt = (fileName?.split('.').pop() || format || '').toLowerCase();
  if (fileExt === 'pdf') return '📄';
  if (['doc', 'docx'].includes(fileExt)) return '📝';
  if (['zip', 'rar', '7z'].includes(fileExt)) return '🗜️';
  if (['txt'].includes(fileExt)) return '📄';
  return '📄';
}

export function getFileTypeName(fileName, format) {
  const fileExt = (fileName?.split('.').pop() || format || '').toLowerCase();
  const typeMap = { pdf: 'PDF Document', doc: 'Word Document', docx: 'Word Document', zip: 'ZIP Archive', rar: 'RAR Archive', '7z': '7-Zip Archive', txt: 'Text File', webm: 'Voice Message' };
  return typeMap[fileExt] || 'Document';
}

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getProfilePhoto(username, userProfiles) {
  return userProfiles?.[username]?.profilePhoto || null;
}

export function formatLastSeen(lastSeen) {
  if (!lastSeen) return 'Unknown';

  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffInMs = now - lastSeenDate;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `Last active ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `Last active ${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `Last active ${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return `Last active on ${lastSeenDate.toLocaleDateString()}`;
  }
}

export function getActiveUserStatus(activeChatType, activeUser, onlineStatus, groups) {
  if (activeChatType === 'group') {
    const group = groups?.find(g => g.id === activeUser);
    const memberCount = group?.members?.length || 0;
    return `${memberCount} members`;
  }

  if (!activeUser || !onlineStatus?.[activeUser]) {
    return 'Unknown';
  }

  const userStatus = onlineStatus[activeUser];
  if (userStatus.online) {
    return 'Online';
  } else if (userStatus.lastSeen) {
    return formatLastSeen(userStatus.lastSeen);
  } else {
    return 'Offline';
  }
}