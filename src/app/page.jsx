'use client';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, push, set } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { Toaster, toast } from "react-hot-toast";
import { FaPhone, FaVideo, FaEllipsisV } from "react-icons/fa";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";

export default function ChatUI() {
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [authChecking, setAuthChecking] = useState(true);

    const [users, setUsers] = useState([]);
    const [activeUser, setActiveUser] = useState("");
    const [chat, setChat] = useState([]);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef(null);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setAuthChecking(false);
            } else {
                setUser(null);
                setAuthChecking(false);
                router.push("/login");
            }
        });

        return () => {
            unsubscribe && unsubscribe();
        };
    }, [router]);

    const username = user?.displayName
        ? user.displayName
        : user?.email
            ? user.email.split("@")[0]
            : "";

    useEffect(() => {
        if (!username) return;
        const userRef = ref(db, `users/${username}`);
        set(userRef, true).catch((err) => {
            console.error("failed to add user to users/:", err);
        });
    }, [username]);

    useEffect(() => {
        const usersRef = ref(db, "users/");
        const unsub = onValue(usersRef, (snapshot) => {
            const list = [];
            snapshot.forEach((child) => {
                if (child.key) list.push(child.key);
            });
            setUsers(list);
        });

        return () => unsub();
    }, []);

    useEffect(() => {
        if (!activeUser || !username) {
            setChat([]);
            return;
        }

        const chatId =
            username < activeUser
                ? `${username}_${activeUser}`
                : `${activeUser}_${username}`;

        const chatRef = ref(db, `chats/${chatId}`);
        const unsub = onValue(chatRef, (snapshot) => {
            const msgs = [];
            snapshot.forEach((child) => {
                msgs.push(child.val());
            });
            setChat(msgs);
        });

        return () => unsub();
    }, [activeUser, username]);


    const sendImageMessage = async (imageUrl) => {
        if (!activeUser || !username) return;

        const chatId =
            username < activeUser
                ? `${username}_${activeUser}`
                : `${activeUser}_${username}`;

        const chatRef = ref(db, `chats/${chatId}`);
        try {
            await push(chatRef, {
                username,
                message: imageUrl,
                type: "image",
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            });
        } catch (err) {
            console.error("sendImageMessage error:", err);
            toast.error("Failed to send image");
        }
    };

    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'chat_app_upload');

        try {
            const response = await fetch('https://api.cloudinary.com/v1_1/dh72bjbwy/image/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            toast.loading('Uploading image...', { id: 'upload' });
            const imageUrl = await uploadToCloudinary(file);
            await sendImageMessage(imageUrl);
            toast.success('Image sent successfully!', { id: 'upload' });
        } catch (error) {
            console.error('Image upload error:', error);
            toast.error('Failed to upload image', { id: 'upload' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };



    if (authChecking) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#111b21]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-300">Checking authentication...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex h-screen bg-[#111b21] text-white overflow-hidden">
            <Toaster 
                position="top-center" 
                reverseOrder={false}
                toastOptions={{
                    style: {
                        background: '#2a3942',
                        color: 'white',
                        border: '1px solid #374248',
                    },
                }}
            />

            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
                disabled={uploading || !activeUser}
            />

            <Sidebar activeUser={activeUser} setActiveUser={setActiveUser} setUsers={setUsers} username={username} users={users} />

            <div className="flex-1 flex flex-col bg-[#0b141a]">
                {/* Chat Header */}
                {activeUser ? (
                    <div className="flex items-center justify-between p-3 bg-[#202c33] border-b border-[#374248]">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-[#00a884] flex justify-center items-center text-white font-semibold">
                                    {activeUser.slice(0, 1).toUpperCase()}
                                </div>
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00a884] rounded-full border-2 border-[#202c33]"></div>
                            </div>
                            <div>
                                <h2 className="font-semibold text-white">{activeUser}</h2>
                                <p className="text-xs text-gray-400">Online</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-gray-300">
                            <FaPhone className="cursor-pointer hover:text-white transition-colors" size={18} />
                            <FaVideo className="cursor-pointer hover:text-white transition-colors" size={18} />
                            <FaEllipsisV className="cursor-pointer hover:text-white transition-colors" size={16} />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-3 bg-[#202c33] border-b border-[#374248]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#2a3942] flex justify-center items-center text-gray-400">
                                💬
                            </div>
                            <div>
                                <h2 className="font-semibold text-white">WhatsApp</h2>
                                <p className="text-xs text-gray-400">Select a user to start chatting</p>
                            </div>
                        </div>
                    </div>
                )}

                <ChatArea fileInputRef={fileInputRef} activeUser={activeUser} chat={chat} uploading={uploading} username={username} />
            </div>
        </div>
    );
}
