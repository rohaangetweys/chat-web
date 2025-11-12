'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, query, orderByKey, limitToLast } from 'firebase/database';
import { db } from '@/lib/firebaseConfig';
import SidebarHeader from './SidebarHeader';
import ContactList from './ContactList';
import GroupModal from './GroupModal';
import { formatLastMessageTime, getLastMessagePreview, getAvailableUsers, getProfilePhoto, toggleUserSelection, filterUsersByQuery, filterGroupsByQuery, prepareContacts, filterContacts } from '../../utils/sidebar';
import { useTheme } from '@/contexts/ThemeContext';

export default function Sidebar({ username, users, groups, setUsers, activeUser, setActiveUser, activeChatType, setActiveChatType, onCreateGroup, unreadCounts, userProfiles, onlineStatus, blockedUsers, onBlockUser, onUnblockUser }) {
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [lastMessages, setLastMessages] = useState({});
    const [sortedContacts, setSortedContacts] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');
    const { isDark } = useTheme();

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

    const handleToggleUserSelection = (user) => {
        setSelectedUsers(prev => toggleUserSelection(prev, user));
    };

    const handleCreateGroup = async () => {
        const groupId = await onCreateGroup(groupName, selectedUsers);
        if (groupId) {
            handleGroupClick(groupId);
            closeGroupModal();
        }
    };

    const availableUsers = useMemo(() => {
        return getAvailableUsers(users, username);
    }, [users, username]);

    const handleSearchChange = (value) => setSearchQuery(value);
    const clearSearch = () => setSearchQuery('');

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
                        setLastMessages(prev => ({
                            ...prev,
                            [user]: {
                                ...lastMessage,
                                timestamp: lastMessage.timestamp || Date.now()
                            }
                        }));
                    } else {
                        setLastMessages(prev => ({ ...prev, [user]: null }));
                    }
                } else {
                    setLastMessages(prev => ({ ...prev, [user]: null }));
                }
            }, (error) => {
                console.error(`Error getting last message for ${user}:`, error);
            });

            unsubscribeFunctions.push(unsubscribe);
        });

        return () => {
            unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        };
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
                        const messageData = child.val();
                        messages.push({
                            id: child.key,
                            ...messageData,
                            timestamp: messageData.timestamp || Date.now()
                        });
                    });

                    if (messages.length > 0) {
                        const lastMessage = messages[messages.length - 1];
                        setLastMessages(prev => ({
                            ...prev,
                            [group.id]: {
                                ...lastMessage,
                                timestamp: lastMessage.timestamp || Date.now()
                            }
                        }));
                    } else {
                        setLastMessages(prev => ({ ...prev, [group.id]: null }));
                    }
                } else {
                    setLastMessages(prev => ({ ...prev, [group.id]: null }));
                }
            }, (error) => {
                console.error(`Error getting last message for group ${group.id}:`, error);
            });

            unsubscribeFunctions.push(unsubscribe);
        });

        return () => {
            unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        };
    }, [groups, username]);

    useEffect(() => {
        const allContacts = prepareContacts(
            availableUsers,
            groups,
            lastMessages,
            unreadCounts,
            onlineStatus
        );

        setSortedContacts(allContacts);
    }, [availableUsers, groups, lastMessages, unreadCounts, onlineStatus]);

    useEffect(() => {
        const filtered = filterUsersByQuery(availableUsers, searchQuery);
        setFilteredUsers(filtered);
    }, [searchQuery, availableUsers]);

    useEffect(() => {
        const filtered = filterGroupsByQuery(groups, searchQuery);
        setFilteredGroups(filtered);
    }, [searchQuery, groups]);

    const filteredContacts = useMemo(() => {
        return filterContacts(
            sortedContacts,
            activeFilter,
            searchQuery,
            filteredUsers,
            filteredGroups,
            lastMessages,
            unreadCounts,
            onlineStatus,
            blockedUsers
        );
    }, [sortedContacts, activeFilter, searchQuery, filteredUsers, filteredGroups, lastMessages, unreadCounts, onlineStatus, blockedUsers]);

    return (
        <>
            <div className={`w-full h-full ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border-r flex flex-col shadow-lg`}>
                <SidebarHeader username={username} getProfilePhoto={(username) => getProfilePhoto(username, userProfiles)} searchQuery={searchQuery} onSearchChange={handleSearchChange} clearSearch={clearSearch} openGroupModal={openGroupModal} activeFilter={activeFilter} setActiveFilter={setActiveFilter} sortedContacts={sortedContacts} blockedUsers={blockedUsers} />
                <div className={`flex-1 overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <ContactList contacts={filteredContacts} activeUser={activeUser} activeChatType={activeChatType} handleUserClick={handleUserClick} handleGroupClick={handleGroupClick} getProfilePhoto={(username) => getProfilePhoto(username, userProfiles)} getLastMessagePreview={(id) => getLastMessagePreview(id, lastMessages, groups)} formatLastMessageTime={(ts) => formatLastMessageTime(ts)} blockedUsers={blockedUsers} onBlockUser={onBlockUser} onUnblockUser={onUnblockUser} />
                </div>
            </div>

            {showGroupModal && (
                <GroupModal availableUsers={availableUsers} onlineStatus={onlineStatus} groupName={groupName} setGroupName={setGroupName} selectedUsers={selectedUsers} toggleUserSelection={handleToggleUserSelection} closeGroupModal={closeGroupModal} handleCreateGroup={handleCreateGroup} />
            )}
        </>
    );
}