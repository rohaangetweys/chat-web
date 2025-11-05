'use client';
import { useState } from 'react';
import { signup } from '@/lib/firebase';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaLock, FaArrowRight, FaWhatsapp } from 'react-icons/fa';

export default function Signup() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const res = await signup(email, password);
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
                default:
                    toast.error('Signup failed. Please try again.');
            }
        } else {
            toast.success('Signup successful!');
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#111b21] via-[#0b141a] to-[#202c33] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#00a884] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#005c4b] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#202c33] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse delay-500"></div>
            </div>

            {/* Floating Icons */}
            <div className="absolute top-20 left-20 text-[#00a884] opacity-20 animate-bounce">
                <FaWhatsapp size={40} />
            </div>
            <div className="absolute bottom-20 right-20 text-[#005c4b] opacity-20 animate-bounce delay-1000">
                <FaWhatsapp size={30} />
            </div>

            <Toaster 
                position="top-center" 
                reverseOrder={false}
                toastOptions={{
                    style: {
                        background: '#202c33',
                        color: 'white',
                        border: '1px solid #374248',
                    },
                }}
            />
            
            <div className="relative z-10 w-full max-w-md">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#00a884] to-[#005c4b] rounded-2xl flex items-center justify-center shadow-lg">
                                <FaWhatsapp className="text-white text-2xl" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-[#111b21] animate-ping"></div>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00a884] to-[#00b884] bg-clip-text text-transparent mb-2">
                        Welcome
                    </h1>
                    <p className="text-gray-400 text-lg">Create your account to get started</p>
                </div>

                {/* Card */}
                <div className="bg-[#202c33]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#374248]/50 p-8 transform hover:scale-[1.02] transition-all duration-300">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Field */}
                        <div className="group">
                            <label className="text-sm font-medium text-gray-300 mb-2 block">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaUser className="text-[#00a884] group-focus-within:text-[#00b884] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className="w-full pl-10 pr-4 py-4 rounded-2xl bg-[#111b21]/50 border border-[#374248] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="group">
                            <label className="text-sm font-medium text-gray-300 mb-2 block">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaEnvelope className="text-[#00a884] group-focus-within:text-[#00b884] transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full pl-10 pr-4 py-4 rounded-2xl bg-[#111b21]/50 border border-[#374248] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="group">
                            <label className="text-sm font-medium text-gray-300 mb-2 block">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLock className="text-[#00a884] group-focus-within:text-[#00b884] transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a strong password"
                                    className="w-full pl-10 pr-4 py-4 rounded-2xl bg-[#111b21]/50 border border-[#374248] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full group relative overflow-hidden bg-gradient-to-r from-[#00a884] to-[#00b884] text-white py-4 rounded-2xl font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl ${
                                loading ? 'opacity-70 cursor-not-allowed' : 'hover:from-[#00b884] hover:to-[#00c884]'
                            }`}
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Creating Account...
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
                            <div className="w-full border-t border-[#374248]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#202c33] text-gray-400">Already have an account?</span>
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
                    <p className="text-gray-500 text-sm">
                        By continuing, you agree to our{' '}
                        <span className="text-[#00a884] hover:text-[#00b884] cursor-pointer transition-colors">
                            Terms of Service
                        </span>{' '}
                        and{' '}
                        <span className="text-[#00a884] hover:text-[#00b884] cursor-pointer transition-colors">
                            Privacy Policy
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}