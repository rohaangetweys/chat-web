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