'use client';
import React from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import ChatArea from '@/components/chatArea/ChatArea';
import AppHeader from '@/components/chatPage/AppHeader';
import ModalsManager from '@/components/chatPage/ModalsManager';
import useAuth from '@/components/chatPage/hooks/useAuth';
import useProfiles from '@/components/chatPage/hooks/useProfiles';
import useGroups from '@/components/chatPage/hooks/useGroups';
import useChatHandlers from '@/components/chatPage/hooks/useChatHandlers';

export default function ChatPage() {
    const { user, authChecking, handleLogout } = useAuth();
    const { users, userProfiles, onlineStatus, username, setUsername } = useProfiles(user);
    const { groups } = useGroups(username);
    const {
        activeUser,
        setActiveUser,
        activeChatType,
        setActiveChatType,
        chat,
        uploading,
        fileInputRef,
        showSidebar,
        setShowSidebar,
        isMobileView,
        showVoiceRecorder,
        setShowVoiceRecorder,
        showFileTypeModal,
        setShowFileTypeModal,
        modalContent,
        modalType,
        openMediaModal,
        closeMediaModal,
        handleFileInputChange,
        handleVoiceRecordComplete,
        createGroupChat,
        sendMessage,
        handlePaperClipClick,
        handleFileTypeSelect,
        unreadCounts,
        setActiveUserHandler,
    } = useChatHandlers({ username, users, groups });

    if (authChecking) return <div className="h-full w-full flex items-center justify-center bg-gray-50"><div className="text-center"><div className="w-16 h-16 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-600">Checking authentication...</p></div></div>;
    if (!user) return null;

    return (
        <div className="flex flex-col h-full w-full px-20 py-10 border bg-gray-300 text-gray-800 overflow-hidden justify-center items-center">
            <input type="file" ref={fileInputRef} onChange={handleFileInputChange} accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.zip,.txt" className="hidden" disabled={uploading} />

            <AppHeader user={user} username={username} handleLogout={handleLogout} />

            <div className="flex w-full h-full overflow-hidden border border-gray-300 gap-4">
                <div className={`flex rounded-3xl overflow-hidden ${isMobileView ? (showSidebar ? 'flex' : 'hidden') : 'flex'} ${isMobileView ? 'w-full' : 'w-1/4'}`}>
                    <Sidebar activeUser={activeUser} setActiveUser={setActiveUserHandler} setUsers={() => { }} username={username} users={users} groups={groups} activeChatType={activeChatType} setActiveChatType={setActiveChatType} onCreateGroup={createGroupChat} unreadCounts={unreadCounts} userProfiles={userProfiles} onlineStatus={onlineStatus} />
                </div>

                <div className={`rounded-3xl overflow-hidden ${isMobileView ? (showSidebar ? 'hidden' : 'flex') : 'flex'} flex-1 flex-col bg-gray-50`}>
                    <ChatArea fileInputRef={fileInputRef} activeUser={activeUser} chat={chat} uploading={uploading} username={username} onOpenMedia={openMediaModal} activeChatType={activeChatType} onShowVoiceRecorder={() => setShowVoiceRecorder(true)} onPaperClipClick={handlePaperClipClick} onSendMessage={sendMessage} userProfiles={userProfiles} />

                    <ModalsManager modalContent={modalContent} modalType={modalType} showFileTypeModal={showFileTypeModal} setShowFileTypeModal={setShowFileTypeModal} showVoiceRecorder={showVoiceRecorder} setShowVoiceRecorder={setShowVoiceRecorder} onFileTypeSelect={handleFileTypeSelect} onVoiceComplete={handleVoiceRecordComplete} closeMediaModal={closeMediaModal} />
                </div>
            </div>
        </div>
    );
}