'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, query, orderByKey, limitToLast } from 'firebase/database';
import { db } from '@/lib/firebaseConfig';
import SidebarHeader from './SidebarHeader';
import SidebarSearch from './SidebarSearch';
import SidebarFilters from './SidebarFilters';
import ContactList from './ContactList';
import GroupModal from './GroupModal';
import { formatLastMessageTime, getLastMessagePreview } from './utils';

export default function Sidebar({ username, users, groups, setUsers, activeUser, setActiveUser, activeChatType, setActiveChatType, onCreateGroup, unreadCounts, userProfiles, onlineStatus }) {
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [sortedContacts, setSortedContacts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');

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
      prev.includes(user) ? prev.filter(u => u !== user) : [...prev, user]
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
    return username;
  };

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
            messages.push({ id: child.key, ...child.val() });
          });

          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            setLastMessages(prev => ({ ...prev, [user]: { ...lastMessage, timestamp: lastMessage.timestamp || lastMessage.id || Date.now() } }));
          } else {
            setLastMessages(prev => ({ ...prev, [user]: null }));
          }
        } else {
          setLastMessages(prev => ({ ...prev, [user]: null }));
        }
      });

      unsubscribeFunctions.push(unsubscribe);
    });

    return () => { unsubscribeFunctions.forEach(unsubscribe => unsubscribe()); };
  }, [availableUsers, username]);

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
            messages.push({ id: child.key, ...child.val() });
          });

          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            setLastMessages(prev => ({ ...prev, [group.id]: { ...lastMessage, timestamp: lastMessage.timestamp || lastMessage.id || Date.now() } }));
          } else {
            setLastMessages(prev => ({ ...prev, [group.id]: null }));
          }
        } else {
          setLastMessages(prev => ({ ...prev, [group.id]: null }));
        }
      });

      unsubscribeFunctions.push(unsubscribe);
    });

    return () => { unsubscribeFunctions.forEach(unsubscribe => unsubscribe()); };
  }, [groups, username]);

  useEffect(() => {
    const allContacts = [];

    availableUsers.forEach(user => {
      const lastMessage = lastMessages[user];
      allContacts.push({ type: 'user', id: user, name: getDisplayName(user), username: user, lastMessage: lastMessage, timestamp: lastMessage?.timestamp || 0, unreadCount: unreadCounts[user] || 0, online: onlineStatus[user]?.online || false });
    });

    groups.forEach(group => {
      const lastMessage = lastMessages[group.id];
      allContacts.push({ type: 'group', id: group.id, name: group.name, lastMessage: lastMessage, timestamp: lastMessage?.timestamp || 0, unreadCount: unreadCounts[group.id] || 0 });
    });

    const sorted = allContacts.sort((a, b) => {
      if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
      if (a.timestamp && !b.timestamp) return -1;
      if (!a.timestamp && b.timestamp) return 1;
      return 0;
    });

    setSortedContacts(sorted);
  }, [availableUsers, groups, lastMessages, unreadCounts, onlineStatus]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(availableUsers);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = availableUsers.filter(user => user.toLowerCase().includes(q));
      setFilteredUsers(filtered);
    }
  }, [searchQuery, availableUsers]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = groups.filter(group => group.name.toLowerCase().includes(q));
      setFilteredGroups(filtered);
    }
  }, [searchQuery, groups]);

  const handleSearchChange = (value) => setSearchQuery(value);
  const clearSearch = () => setSearchQuery('');

  const filteredContacts = useMemo(() => {
    if (searchQuery.trim() !== '') {
      const searchResults = [];

      filteredGroups.forEach((group) => {
        searchResults.push({ type: 'group', id: group.id, name: group.name, lastMessage: lastMessages[group.id], unreadCount: unreadCounts[group.id] || 0 });
      });

      filteredUsers.forEach((user) => {
        searchResults.push({ type: 'user', id: user, name: getDisplayName(user), username: user, lastMessage: lastMessages[user], unreadCount: unreadCounts[user] || 0, online: onlineStatus[user]?.online || false });
      });

      return searchResults;
    }

    switch (activeFilter) {
      case 'unread':
        return sortedContacts.filter(contact => contact.unreadCount > 0);
      case 'groups':
        return sortedContacts.filter(contact => contact.type === 'group');
      case 'all':
      default:
        return sortedContacts;
    }
  }, [sortedContacts, activeFilter, searchQuery, filteredUsers, filteredGroups, lastMessages, unreadCounts, onlineStatus]);

  return (
    <>
      <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col shadow-lg">
        <SidebarHeader username={username} getProfilePhoto={getProfilePhoto} />
        <SidebarSearch searchQuery={searchQuery} onSearchChange={handleSearchChange} clearSearch={clearSearch} openGroupModal={openGroupModal} />
        <SidebarFilters activeFilter={activeFilter} setActiveFilter={setActiveFilter} sortedContacts={sortedContacts} />
        <div className="flex-1 overflow-y-auto bg-white">
          <ContactList contacts={filteredContacts} activeUser={activeUser} activeChatType={activeChatType} handleUserClick={handleUserClick} handleGroupClick={handleGroupClick} getProfilePhoto={getProfilePhoto} getLastMessagePreview={(id) => getLastMessagePreview(id, lastMessages, groups)} formatLastMessageTime={(ts) => formatLastMessageTime(ts)} />
        </div>
      </div>

      {showGroupModal && (
        <GroupModal availableUsers={availableUsers} onlineStatus={onlineStatus} groupName={groupName} setGroupName={setGroupName} selectedUsers={selectedUsers} toggleUserSelection={toggleUserSelection} closeGroupModal={closeGroupModal} handleCreateGroup={handleCreateGroup} />
      )}
    </>
  );
}