'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import ChatArea from '@/components/chatArea/ChatArea';
import AppHeader from '@/components/AppHeader';
import ModalsManager from '@/components/chatArea/ModalsManager';
import useAuth from '@/hooks/useAuth';
import useProfiles from '@/hooks/useProfiles';
import useGroups from '@/hooks/useGroups';
import useChatHandlers from '@/hooks/useChatHandlers';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/contexts/ThemeContext';

export default function ChatPage() {
    const router = useRouter();
    const { user, authChecking, handleLogout } = useAuth();
    const { users, userProfiles, onlineStatus, username, setUsername } = useProfiles(user);
    const { groups } = useGroups(username);
    const { isDark } = useTheme();

    const [showSidebar, setShowSidebar] = useState(true);

    const { activeUser, setActiveUser, activeChatType, setActiveChatType, chat, uploading, fileInputRef, isMobileView, showVoiceRecorder, setShowVoiceRecorder, showFileTypeModal, setShowFileTypeModal, modalContent, modalType, openMediaModal, closeMediaModal, handleFileInputChange, handleVoiceRecordComplete, createGroupChat, sendMessage, handlePaperClipClick, handleFileTypeSelect, unreadCounts, setActiveUserHandler } = useChatHandlers({ username, users, groups, setShowSidebar });

    const handleBackToSidebar = () => {
        setShowSidebar(true);
        setActiveUser("");
    };

    const startVoiceCall = () => {
        if (!activeUser || activeChatType === 'group') {
            toast.error('Voice calls are only available for individual chats');
            return;
        }
        console.log('Starting voice call with:', activeUser);
    };

    if (authChecking) return (
        <div className="h-full w-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-[#0084ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Checking authentication...</p>
            </div>
        </div>
    );

    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <div className={`flex flex-col h-full w-full ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-300 text-gray-800'} overflow-hidden justify-center items-center`}>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.zip,.txt"
                className="hidden"
                disabled={uploading}
            />

            <AppHeader user={user} username={username} handleLogout={handleLogout} />

            <div className={`flex w-full h-full overflow-hidden border ${isDark ? 'border-gray-600 gap-0! rounded-3xl' : 'border-gray-300'} gap-4`}>
                <div className={`flex rounded-3xl overflow-hidden ${isMobileView ? (showSidebar ? 'flex' : 'hidden') : 'flex'} ${isMobileView ? 'w-full' : 'w-1/4'}`}>
                    <Sidebar activeUser={activeUser} setActiveUser={setActiveUserHandler} setUsers={() => { }} username={username} users={users} groups={groups} activeChatType={activeChatType} setActiveChatType={setActiveChatType} onCreateGroup={createGroupChat} unreadCounts={unreadCounts} userProfiles={userProfiles} onlineStatus={onlineStatus} />
                </div>

                <div className={`rounded-3xl overflow-hidden ${isMobileView ? (showSidebar ? 'hidden' : 'flex') : 'flex'} flex-1 flex-col ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <ChatArea
                        fileInputRef={fileInputRef}
                        activeUser={activeUser}
                        chat={chat}
                        uploading={uploading}
                        username={username}
                        onOpenMedia={openMediaModal}
                        activeChatType={activeChatType}
                        onPaperClipClick={handlePaperClipClick}
                        onSendMessage={sendMessage}  // Make sure this function can handle audio files
                        userProfiles={userProfiles}
                        onlineStatus={onlineStatus}
                        groups={groups}
                        isMobileView={isMobileView}
                        onBackToSidebar={handleBackToSidebar}
                        onStartVoiceCall={startVoiceCall}
                    />
                    <ModalsManager modalContent={modalContent} modalType={modalType} showFileTypeModal={showFileTypeModal} setShowFileTypeModal={setShowFileTypeModal} showVoiceRecorder={showVoiceRecorder} setShowVoiceRecorder={setShowVoiceRecorder} onFileTypeSelect={handleFileTypeSelect} onVoiceComplete={handleVoiceRecordComplete} closeMediaModal={closeMediaModal} />
                </div>
            </div>
        </div>
    );
}