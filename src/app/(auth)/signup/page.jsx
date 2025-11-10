'use client';
import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaLock, FaComments, FaCamera, FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import { signup } from '@/lib/firebaseServices';
import InputField from '@/components/auth/InputField';
import SubmitButton from '@/components/auth/SubmitButton';
import SwitchPage from '@/components/auth/SwitchPage';

export default function Signup() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef(null);

    const handleProfilePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handleProfilePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file (JPEG, PNG, etc.)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setUploadingPhoto(true);
        try {
            const previewUrl = URL.createObjectURL(file);
            setProfilePhotoUrl(previewUrl);
            setProfilePhoto(file);
            toast.success('Profile photo added!');
        } catch (error) {
            console.error('Error processing profile photo:', error);
            toast.error('Failed to process profile photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const removeProfilePhoto = (e) => {
        e.stopPropagation();
        setProfilePhoto(null);
        setProfilePhotoUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast.success('Profile photo removed');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (!username.trim()) {
            toast.error('Please enter a username');
            setLoading(false);
            return;
        }
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            toast.error('Username can only contain letters, numbers, and underscores');
            setLoading(false);
            return;
        }
        if (username.length < 3 || username.length > 20) {
            toast.error('Username must be between 3 and 20 characters');
            setLoading(false);
            return;
        }

        const res = await signup(email, password, username, profilePhoto);
        setLoading(false);

        if (!res.success) {
            switch (res.message) {
                case 'auth/email-already-in-use':
                    toast.error('Email already in use');
                    break;
                case 'auth/invalid-email':
                    toast.error('Invalid email address');
                    break;
                case 'auth/weak-password':
                    toast.error('Password should be at least 6 characters');
                    break;
                case 'username-already-exists':
                    toast.error('Username already taken');
                    break;
                default:
                    toast.error('Signup failed. Please try again.');
            }
        } else {
            toast.success('Signup successful!');
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 relative overflow-hidden w-full">
            <div className="relative z-10 w-full max-w-md max-sm:max-w-2xl max-sm:scale-95">
                {/* Header Section */}
                <div className="text-center mb-8 max-sm:mb-3">
                    <div className="flex justify-center mb-4 max-sm:hidden">
                        <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#0084ff] to-[#00b884] rounded-2xl flex items-center justify-center shadow-lg">
                                <FaComments className="text-white text-2xl" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-4xl max-sm:text-3xl font-bold bg-gradient-to-r from-[#0084ff] to-[#00b884] bg-clip-text text-transparent mb-2 max-sm:mb-0">
                        Welcome
                    </h1>
                    <p className="text-gray-600 text-lg max-sm:text-xs">Create your account to get started</p>
                </div>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-8 transform hover:scale-[1.02] transition-all duration-300">
                    <form onSubmit={handleSubmit} className="space-y-6 max-sm:space-y-3">
                        {/* Profile Photo Upload */}
                        <div className="flex flex-col items-center mb-6">
                            <div
                                className="relative group cursor-pointer"
                                onClick={handleProfilePhotoClick}
                            >
                                <div className="w-24 h-24 max-sm:w-18 max-sm:h-18 rounded-full bg-gray-200 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-[#0084ff] group-hover:shadow-xl">
                                    {profilePhotoUrl ? (
                                        <Image
                                            src={profilePhotoUrl}
                                            alt="Profile preview"
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                console.error('Image load error');
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-[#0084ff] transition-colors">
                                            <FaCamera size={24} />
                                            <span className="text-xs mt-1 max-sm:text-[10px]">Add Photo</span>
                                        </div>
                                    )}

                                </div>

                                {/* Remove button - only show when there's a photo */}
                                {profilePhotoUrl && (
                                    <button
                                        type="button"
                                        onClick={removeProfilePhoto}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                                    >
                                        <FaTimes size={12} />
                                    </button>
                                )}

                                {/* Uploading indicator */}
                                {uploadingPhoto && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            {/* Hidden file input */}
                            <input type="file" ref={fileInputRef} onChange={handleProfilePhotoChange} accept="image/*" className="hidden" />

                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Click to upload profile photo (optional) <br />
                                <span className="text-[#0084ff]">Max 5MB • JPEG, PNG, etc.</span>
                            </p>
                        </div>

                        <InputField label="Username" type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="Choose a username" Icon={FaUser} required />
                        <p className="text-xs text-gray-500 mt-1 max-sm:text-[10px]">3-20 characters, letters, numbers, and underscores only</p>

                        <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" Icon={FaEnvelope} required />

                        <InputField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" Icon={FaLock} required />

                        <SubmitButton loading={loading} uploadingPhoto={uploadingPhoto} loadingText="Creating Account..." uploadingText="Uploading Photo..." defaultText="Get Started" />
                    </form>
                    <SwitchPage dividerText={'Already have an account?'} linkTo={'/login'} linkText={'Sign in to your account'} />
                </div>
            </div>
        </div>
    );
}