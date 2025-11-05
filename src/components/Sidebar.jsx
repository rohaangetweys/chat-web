'use client';
import { logout } from '@/lib/firebase';
import { FaSearch, FaUsers } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useState, useEffect, useMemo } from 'react';

export default function Sidebar({ username, users, groups, setUsers, activeUser, setActiveUser, activeChatType, setActiveChatType, onCreateGroup }) {
  const router = useRouter();
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'groups'
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);

  const handleLogout = async () => {
    const res = await logout();
    if (res?.success) {
      toast.success("Logged out");
      router.push("/login");
    } else {
      toast.error("Logout failed");
      console.error(res);
    }
  };

  function getRandomColor() {
    const r = Math.floor(Math.random() * 80) + 40;
    const g = Math.floor(Math.random() * 80) + 40;
    const b = Math.floor(Math.random() * 80) + 40;

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
      setActiveTab('groups'); // Switch to groups tab after creation
    }
  };

  // Use useMemo to prevent unnecessary recalculations
  const availableUsers = useMemo(() => {
    return users.filter(u => u !== username);
  }, [users, username]);

  // Filter users based on search query
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
  }, [searchQuery, availableUsers]); // availableUsers is now stable due to useMemo

  // Filter groups based on search query
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

  return (
    <>
      <div className="w-full bg-[#202c33] border-r border-[#374248] flex flex-col h-screen">
        {/* User Header */}
        <div className="p-3 bg-[#202c33] flex items-center gap-3 border-b border-[#374248]">
          <div className="w-10 h-10 rounded-full bg-[#00a884] flex justify-center items-center text-white font-semibold">
            {username?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-white truncate">{username}</h2>
            <p className="text-xs text-gray-400 truncate">Online</p>
          </div>
          <button
            onClick={openGroupModal}
            className="p-2 rounded-full bg-[#00a884] hover:bg-[#00b884] transition-colors"
            title="Create Group Chat"
          >
            <FaUsers className="text-white" size={16} />
          </button>
          <button
            onClick={handleLogout}
            className="bg-[#2a3942] text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-[#374248] transition text-sm border border-[#374248]"
            title="Logout"
          >
            Logout
          </button>
        </div>

        {/* Breadcrumbs */}
        <div className="flex bg-[#202c33] border-b border-[#374248]">
          <button
            onClick={() => {
              setActiveTab('users');
              clearSearch();
            }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'users'
                ? 'text-[#00a884] border-b-2 border-[#00a884]'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            Users
          </button>
          <button
            onClick={() => {
              setActiveTab('groups');
              clearSearch();
            }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'groups'
                ? 'text-[#00a884] border-b-2 border-[#00a884]'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            Groups ({groups.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-[#202c33]">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={activeTab === 'users' ? "Search users..." : "Search groups..."}
              className="w-full p-3 pl-12 rounded-lg bg-[#2a3942] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00a884] border-none"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#111b21]">
          {activeTab === 'users' ? (
            /* Users List */
            filteredUsers.length === 0 ? (
              <div className="text-center mt-10">
                <div className="w-16 h-16 bg-[#2a3942] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">
                    {searchQuery ? '🔍' : '👤'}
                  </span>
                </div>
                <p className="text-gray-400">
                  {searchQuery ? 'No users found' : 'No users found'}
                </p>
                {searchQuery && (
                  <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
                )}
              </div>
            ) : (
              filteredUsers.map((u, i) => (
                <div
                  key={u + i}
                  onClick={() => handleUserClick(u)}
                  className={`flex items-center gap-3 p-3 cursor-pointer border-b border-[#374248] hover:bg-[#2a3942] transition-colors ${u === activeUser && activeChatType === 'individual' ? "bg-[#2a3942]" : ""
                    }`}
                >
                  <div className="relative">
                    <h2
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl text-white"
                      style={{ backgroundColor: getRandomColor() }}
                    >
                      {u.slice(0, 1).toUpperCase()}
                    </h2>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21]"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{u}</h3>
                    <p className="text-sm text-gray-400 truncate">
                      Tap to start conversation
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">●</span>
                </div>
              ))
            )
          ) : (
            /* Groups List */
            filteredGroups.length === 0 ? (
              <div className="text-center mt-10">
                <div className="w-16 h-16 bg-[#2a3942] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">
                    {searchQuery ? '🔍' : '👥'}
                  </span>
                </div>
                <p className="text-gray-400 mb-2">
                  {searchQuery ? 'No groups found' : 'No groups yet'}
                </p>
                {searchQuery ? (
                  <p className="text-sm text-gray-500">Try a different search term</p>
                ) : (
                  <p className="text-sm text-gray-500">Create your first group to get started</p>
                )}
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => handleGroupClick(group.id)}
                  className={`flex items-center gap-3 p-3 cursor-pointer border-b border-[#374248] hover:bg-[#2a3942] transition-colors ${group.id === activeUser && activeChatType === 'group' ? "bg-[#2a3942]" : ""
                    }`}
                >
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl text-white bg-purple-600"
                    >
                      👥
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21]"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{group.name}</h3>
                    <p className="text-sm text-gray-400 truncate">
                      {group.members.length} members
                    </p>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Group Creation Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2a3942] rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Create Group Chat</h3>

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full p-3 rounded-lg bg-[#202c33] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00a884] border-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-300 mb-2">Select Users</label>
              <div className="max-h-48 overflow-y-auto bg-[#202c33] rounded-lg p-2">
                {availableUsers.map((user) => (
                  <div key={user} className="flex items-center gap-3 p-2 hover:bg-[#2a3942] rounded">
                    <input
                      type="checkbox"
                      id={user}
                      checked={selectedUsers.includes(user)}
                      onChange={() => toggleUserSelection(user)}
                      className="w-4 h-4 text-[#00a884] bg-[#374248] border-[#374248] rounded focus:ring-[#00a884] focus:ring-2"
                    />
                    <label htmlFor={user} className="text-white cursor-pointer flex-1">
                      {user}
                    </label>
                  </div>
                ))}
              </div>
              {selectedUsers.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Selected: {selectedUsers.join(', ')}
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeGroupModal}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedUsers.length === 0}
                className="px-4 py-2 bg-[#00a884] text-white rounded-lg hover:bg-[#00b884] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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