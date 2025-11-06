'use client';
import { useState, useRef } from 'react';
import { signup } from '@/lib/firebase';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaLock, FaArrowRight, FaComments, FaCamera, FaTimes } from 'react-icons/fa';
import Image from 'next/image';

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
        console.log('Profile photo clicked'); // Debug log
        fileInputRef.current?.click();
    };

    const handleProfilePhotoChange = async (e) => {
        console.log('File input changed'); // Debug log
        const file = e.target.files?.[0];
        if (!file) {
            console.log('No file selected'); // Debug log
            return;
        }

        console.log('File selected:', file.name, file.type, file.size); // Debug log

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file (JPEG, PNG, etc.)');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setUploadingPhoto(true);
        try {
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            console.log('Preview URL created:', previewUrl); // Debug log
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
        e.stopPropagation(); // Prevent triggering the file input
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

        // Validate username
        if (!username.trim()) {
            toast.error('Please enter a username');
            setLoading(false);
            return;
        }

        // Validate username format (alphanumeric and underscores)
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            toast.error('Username can only contain letters, numbers, and underscores');
            setLoading(false);
            return;
        }

        // Validate username length
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
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#00a884] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#00a884] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-500"></div>
            </div>

            {/* Floating Icons */}
            <div className="absolute top-20 left-20 text-[#00a884] opacity-10 animate-bounce">
                <FaComments size={40} />
            </div>
            <div className="absolute bottom-20 right-20 text-[#00a884] opacity-10 animate-bounce delay-1000">
                <FaComments size={30} />
            </div>

            <Toaster 
                position="top-center" 
                reverseOrder={false}
                toastOptions={{
                    style: {
                        background: '#00a884',
                        color: 'white',
                        border: '1px solid #00a884',
                    },
                }}
            />
            
            <div className="relative z-10 w-full max-w-md">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#00a884] to-[#00b884] rounded-2xl flex items-center justify-center shadow-lg">
                                <FaComments className="text-white text-2xl" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#00a884] rounded-full border-4 border-white animate-ping opacity-75"></div>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00a884] to-[#00b884] bg-clip-text text-transparent mb-2">
                        Welcome
                    </h1>
                    <p className="text-gray-600 text-lg">Create your account to get started</p>
                </div>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-8 transform hover:scale-[1.02] transition-all duration-300">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Profile Photo Upload */}
                        <div className="flex flex-col items-center mb-6">
                            <div 
                                className="relative group cursor-pointer"
                                onClick={handleProfilePhotoClick}
                            >
                                <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-[#00a884] group-hover:shadow-xl">
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
                                        <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-[#00a884] transition-colors">
                                            <FaCamera size={24} />
                                            <span className="text-xs mt-1">Add Photo</span>
                                        </div>
                                    )}
                                    
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 rounded-full bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                        <FaCamera className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                                    </div>
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
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleProfilePhotoChange}
                                accept="image/*"
                                className="hidden"
                            />
                            
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Click to upload profile photo (optional)
                                <br />
                                <span className="text-[#00a884]">Max 5MB • JPEG, PNG, etc.</span>
                            </p>
                        </div>

                        {/* Username Field */}
                        <div className="group">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaUser className="text-[#00a884] group-focus-within:text-[#00b884] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                    placeholder="Choose a username"
                                    className="w-full pl-10 pr-4 py-4 rounded-2xl bg-gray-50/80 border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">3-20 characters, letters, numbers, and underscores only</p>
                        </div>

                        {/* Email Field */}
                        <div className="group">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaEnvelope className="text-[#00a884] group-focus-within:text-[#00b884] transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full pl-10 pr-4 py-4 rounded-2xl bg-gray-50/80 border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="group">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLock className="text-[#00a884] group-focus-within:text-[#00b884] transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a strong password"
                                    className="w-full pl-10 pr-4 py-4 rounded-2xl bg-gray-50/80 border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || uploadingPhoto}
                            className={`w-full group relative overflow-hidden bg-gradient-to-r from-[#00a884] to-[#00b884] text-white py-4 rounded-2xl font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl ${
                                loading || uploadingPhoto ? 'opacity-70 cursor-not-allowed' : 'hover:from-[#00b884] hover:to-[#00c884]'
                            }`}
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Creating Account...
                                    </>
                                ) : uploadingPhoto ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Uploading Photo...
                                    </>
                                ) : (
                                    <>
                                        Get Started
                                        <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#00b884] to-[#00c884] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                        </div>
                    </div>

                    {/* Login Link */}
                    <div className="text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center text-[#00a884] font-semibold hover:text-[#00b884] transition-colors group"
                        >
                            Sign in to your account
                            <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-gray-600 text-sm">
                        By continuing, you agree to our{' '}
                        <span className="text-[#00a884] hover:text-[#00b884] cursor-pointer transition-colors font-medium">
                            Terms of Service
                        </span>{' '}
                        and{' '}
                        <span className="text-[#00a884] hover:text-[#00b884] cursor-pointer transition-colors font-medium">
                            Privacy Policy
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}