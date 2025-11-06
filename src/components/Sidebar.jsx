'use client';
import { FaSearch, FaUsers } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { ref, onValue, query, orderByKey, limitToLast, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { HiOutlineUserGroup } from 'react-icons/hi2';
import Image from 'next/image';

export default function Sidebar({ username, users, groups, setUsers, activeUser, setActiveUser, activeChatType, setActiveChatType, onCreateGroup, unreadCounts, userProfiles }) {
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [sortedContacts, setSortedContacts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'unread', 'groups'

  function getRandomColor() {
    // Brighter colors for light theme
    const r = Math.floor(Math.random() * 100) + 150;
    const g = Math.floor(Math.random() * 100) + 150;
    const b = Math.floor(Math.random() * 100) + 150;

    const toHex = (n) => n.toString(16).padStart(2, "0");

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  const handleUserClick = (user) => {
    setActiveUser(user, 'individual');
  };

  const handleGroupClick = (groupId) => {
    setActiveUser(groupId, 'group');
  };

  const openGroupModal = () => {
    setShowGroupModal(true);
    setGroupName('');
    setSelectedUsers([]);
  };

  const closeGroupModal = () => {
    setShowGroupModal(false);
    setGroupName('');
    setSelectedUsers([]);
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev =>
      prev.includes(user)
        ? prev.filter(u => u !== user)
        : [...prev, user]
    );
  };

  const handleCreateGroup = async () => {
    const groupId = await onCreateGroup(groupName, selectedUsers);
    if (groupId) {
      handleGroupClick(groupId);
      closeGroupModal();
    }
  };

  const availableUsers = useMemo(() => {
    return users.filter(u => u !== username);
  }, [users, username]);

  const getProfilePhoto = (username) => {
    return userProfiles[username]?.profilePhoto || null;
  };

  const getDisplayName = (username) => {
    return username; // Since we're only using username now
  };

  // --- Last Message Fetching Logic ---

  // Fetch last messages for individual chats with timestamps
  useEffect(() => {
    if (!username) return;

    const unsubscribeFunctions = [];

    availableUsers.forEach((user) => {
      const chatId = username < user ? `${username}_${user}` : `${user}_${username}`;
      const chatRef = ref(db, `chats/${chatId}`);
      const lastMessageQuery = query(chatRef, orderByKey(), limitToLast(1));

      const unsubscribe = onValue(lastMessageQuery, (snapshot) => {
        if (snapshot.exists()) {
          const messages = [];
          snapshot.forEach((child) => {
            messages.push({
              id: child.key,
              ...child.val()
            });
          });

          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            setLastMessages(prev => ({
              ...prev,
              [user]: {
                ...lastMessage,
                timestamp: lastMessage.timestamp || lastMessage.id || Date.now()
              }
            }));
          } else {
            setLastMessages(prev => ({
              ...prev,
              [user]: null
            }));
          }
        } else {
          setLastMessages(prev => ({
            ...prev,
            [user]: null
          }));
        }
      });

      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [availableUsers, username]);

  // Fetch last messages for group chats with timestamps
  useEffect(() => {
    if (!username) return;

    const unsubscribeFunctions = [];

    groups.forEach((group) => {
      const messagesRef = ref(db, `groupChats/${group.id}/messages`);
      const lastMessageQuery = query(messagesRef, orderByKey(), limitToLast(1));

      const unsubscribe = onValue(lastMessageQuery, (snapshot) => {
        if (snapshot.exists()) {
          const messages = [];
          snapshot.forEach((child) => {
            messages.push({
              id: child.key,
              ...child.val()
            });
          });

          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            setLastMessages(prev => ({
              ...prev,
              [group.id]: {
                ...lastMessage,
                timestamp: lastMessage.timestamp || lastMessage.id || Date.now()
              }
            }));
          } else {
            setLastMessages(prev => ({
              ...prev,
              [group.id]: null
            }));
          }
        } else {
          setLastMessages(prev => ({
            ...prev,
            [group.id]: null
          }));
        }
      });

      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [groups, username]);

  // Sort contacts by last message timestamp
  useEffect(() => {
    const allContacts = [];

    // Add users with their last message info
    availableUsers.forEach(user => {
      const lastMessage = lastMessages[user];
      allContacts.push({
        type: 'user',
        id: user,
        name: getDisplayName(user),
        username: user,
        lastMessage: lastMessage,
        timestamp: lastMessage?.timestamp || 0,
        unreadCount: unreadCounts[user] || 0
      });
    });

    // Add groups with their last message info
    groups.forEach(group => {
      const lastMessage = lastMessages[group.id];
      allContacts.push({
        type: 'group',
        id: group.id,
        name: group.name,
        lastMessage: lastMessage,
        timestamp: lastMessage?.timestamp || 0,
        unreadCount: unreadCounts[group.id] || 0
      });
    });

    // Sort by timestamp in descending order (newest first)
    const sorted = allContacts.sort((a, b) => {
      // If both have messages, sort by timestamp
      if (a.timestamp && b.timestamp) {
        return b.timestamp - a.timestamp;
      }
      // If only one has a message, put that one first
      if (a.timestamp && !b.timestamp) {
        return -1;
      }
      if (!a.timestamp && b.timestamp) {
        return 1;
      }
      // If neither has messages, maintain original order
      return 0;
    });

    setSortedContacts(sorted);
  }, [availableUsers, groups, lastMessages, unreadCounts]);

  // Filter contacts based on active filter
  const filteredContacts = useMemo(() => {
    if (searchQuery.trim() !== '') {
      // If searching, use the existing search logic
      const searchResults = [];

      filteredGroups.forEach((group) => {
        const contact = {
          type: 'group',
          id: group.id,
          name: group.name,
          lastMessage: lastMessages[group.id],
          unreadCount: unreadCounts[group.id] || 0
        };
        searchResults.push(contact);
      });

      filteredUsers.forEach((user) => {
        const contact = {
          type: 'user',
          id: user,
          name: getDisplayName(user),
          username: user,
          lastMessage: lastMessages[user],
          unreadCount: unreadCounts[user] || 0
        };
        searchResults.push(contact);
      });

      return searchResults;
    }

    // Apply filters when not searching
    switch (activeFilter) {
      case 'unread':
        return sortedContacts.filter(contact => contact.unreadCount > 0);
      case 'groups':
        return sortedContacts.filter(contact => contact.type === 'group');
      case 'all':
      default:
        return sortedContacts;
    }
  }, [sortedContacts, activeFilter, searchQuery, filteredUsers, filteredGroups, lastMessages, unreadCounts]);

  const getLastMessagePreview = (target) => {
    const lastMessage = lastMessages[target];
    if (!lastMessage) return 'No messages yet';

    const username = lastMessage.username;
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

    // For group chats, show username who sent the message
    if (groups.some(group => group.id === target) && lastMessage.username) {
      return `${lastMessage.username}: ${messageContent}`;
    }

    return messageContent;
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';

    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - messageDate;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 24) {
      // Today - show time
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      // Within a week - show day name
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older than a week - show date
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // --- Search and Filter Effects ---

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(availableUsers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = availableUsers.filter(user =>
        user.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, availableUsers]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = groups.filter(group =>
        group.name.toLowerCase().includes(query)
      );
      setFilteredGroups(filtered);
    }
  }, [searchQuery, groups]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const renderContactItem = (contact) => {
    const isActive = contact.id === activeUser &&
      (contact.type === activeChatType ||
        (contact.type === 'user' && activeChatType === 'individual') ||
        (contact.type === 'group' && activeChatType === 'group'));

    const hasUnread = contact.unreadCount > 0;
    const profilePhoto = contact.type === 'user' ? getProfilePhoto(contact.id) : null;

    return (
      <div
        key={`${contact.type}-${contact.id}`}
        onClick={() => contact.type === 'user' ? handleUserClick(contact.id) : handleGroupClick(contact.id)}
        // Light Theme Styling
        className={`flex items-center gap-3 p-3 cursor-pointer border-b border-gray-100 transition-colors ${isActive
          ? "bg-gray-200"
          : hasUnread
            ? "bg-teal-50 hover:bg-gray-100" // Subtle highlight for unread
            : "hover:bg-gray-100"
          }`}
      >
        <div className="relative">
          {contact.type === 'user' ? (
            profilePhoto ? (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#00a884] shadow-md">
                <Image
                  src={profilePhoto}
                  alt={contact.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <h2
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl text-white shadow-md"
                style={{ backgroundColor: getRandomColor() }}
              >
                {contact.name.slice(0, 1).toUpperCase()}
              </h2>
            )
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl text-white bg-indigo-500 shadow-md">
              <HiOutlineUserGroup size={24} />
            </div>
          )}
          {/* Online/Active status - subtle in light theme */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-white"></div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className={`font-semibold truncate text-gray-800`}>
              {contact.name}
            </h3>
            {contact.lastMessage && (
              <span className={`text-xs whitespace-nowrap ml-2 ${hasUnread ? "text-[#00a884] font-semibold" : "text-gray-500"}`}>
                {formatLastMessageTime(contact.lastMessage.timestamp)}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <p className={`text-sm truncate ${hasUnread ? "text-gray-800 font-medium" : "text-gray-500"}`}>
              {getLastMessagePreview(contact.id)}
            </p>

            {hasUnread && (
              <div className="shrink-0 ml-2">
                <div className="bg-[#00a884] text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-bold shadow-sm">
                  {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Light Theme Primary Container */}
      <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col shadow-lg">
        {/* User Header */}
        <div className="p-4 bg-gray-50 flex items-center gap-3 border-b border-gray-200 shadow-sm">
          {getProfilePhoto(username) ? (
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#00a884]">
              <Image
                src={getProfilePhoto(username)}
                alt={username}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#00a884] flex justify-center items-center text-white font-semibold shadow-md">
              {username?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-800 truncate">{username}</h2>
            <p className="text-xs text-gray-500 truncate">Online</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-white flex items-center justify-between gap-2">
          <div className="relative w-full">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={"Search contacts..."}
              className="w-full p-3 pl-12 rounded-full bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] border-none shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={openGroupModal}
            className="p-2 rounded-full text-[#00a884] hover:bg-gray-200 transition-colors"
            title="Create Group Chat"
          >
            <FaUsers size={27} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex px-4 gap-2 pb-2 border-b border-gray-100">
          <button
            onClick={() => setActiveFilter('all')}
            className={`h-9 px-3 text-sm font-medium transition-colors rounded-full ${activeFilter === 'all'
              ? 'bg-[#00a884] text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`h-9 px-3 rounded-full text-sm font-medium transition-colors relative ${activeFilter === 'unread'
              ? 'bg-[#00a884] text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
              }`}
          >
            Unread
            {sortedContacts.some(contact => contact.unreadCount > 0) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter('groups')}
            className={`h-9 px-3 rounded-full text-sm font-medium transition-colors ${activeFilter === 'groups'
              ? 'bg-[#00a884] text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
              }`}
          >
            Groups
          </button>
        </div>

        {/* Content Area - show filtered contacts */}
        <div className="flex-1 overflow-y-auto bg-white">
          {filteredContacts.length > 0 ? (
            filteredContacts.map(renderContactItem)
          ) : (
            <div className="text-center mt-8 px-4">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                {activeFilter === 'unread' ? (
                  <span className="text-2xl">✅</span>
                ) : activeFilter === 'groups' ? (
                  <span className="text-2xl">👥</span>
                ) : (
                  <span className="text-2xl">🔍</span>
                )}
              </div>
              <p className="text-gray-700 font-medium mb-1">
                {searchQuery
                  ? 'No contacts found'
                  : activeFilter === 'unread'
                    ? 'You\'re all caught up!'
                    : activeFilter === 'groups'
                      ? 'No groups yet'
                      : 'No contacts yet'
                }
              </p>
              <p className="text-sm text-gray-500">
                {searchQuery
                  ? 'Try a different search term.'
                  : activeFilter === 'unread'
                    ? 'You have no unread messages.'
                    : activeFilter === 'groups'
                      ? 'Click the group icon to create a group.'
                      : 'Start a conversation or create a group.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Group Creation Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/85 bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-auto shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-5">Create Group Chat</h3>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2 font-medium">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full p-3 rounded-lg bg-gray-100 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00a884] border border-gray-200"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-2 font-medium">Select Users</label>
              <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-lg border border-gray-200 p-2">
                {availableUsers.map((user) => (
                  <div key={user} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => toggleUserSelection(user)}>
                    <input
                      type="checkbox"
                      id={`group-user-${user}`}
                      checked={selectedUsers.includes(user)}
                      readOnly // Make read-only as click handler is on the div
                      className="w-4 h-4 text-[#00a884] bg-white border-gray-300 rounded focus:ring-[#00a884] focus:ring-2"
                    />
                    <label htmlFor={`group-user-${user}`} className="text-gray-800 cursor-pointer flex-1">
                      {user}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeGroupModal}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedUsers.length === 0}
                className="px-4 py-2 bg-[#00a884] text-white rounded-lg hover:bg-[#00b884] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}