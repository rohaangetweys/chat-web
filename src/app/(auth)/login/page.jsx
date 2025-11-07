'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { FaEnvelope, FaLock, FaArrowRight, FaComments, FaShieldAlt } from 'react-icons/fa';
import { login } from '@/lib/firebase/firebaseServices';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const res = await login(email, password);
        setLoading(false);

        if (!res.success) {
            switch (res.message) {
                case 'auth/invalid-credential':
                    toast.error('Invalid email or password');
                    break;
                case 'auth/invalid-email':
                    toast.error('Please enter a valid email');
                    break;
                default:
                    toast.error('Login failed. Please try again.');
                    break;
            }
        } else {
            toast.success('Login successful!');
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 relative overflow-hidden w-full">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#00a884] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse"></div>
                <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#00a884] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-500"></div>
            </div>

            {/* Floating Icons */}
            <div className="absolute top-20 right-20 text-[#00a884] opacity-10 animate-bounce">
                <FaShieldAlt size={40} />
            </div>
            <div className="absolute bottom-20 left-20 text-[#00a884] opacity-10 animate-bounce delay-1000">
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
                        Welcome Back
                    </h1>
                    <p className="text-gray-600 text-lg">Sign in to continue your conversations</p>
                </div>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-8 transform hover:scale-[1.02] transition-all duration-300">
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-4 py-4 rounded-2xl bg-gray-50/80 border border-gray-300 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-[#00a884] bg-gray-50 border-gray-300 rounded focus:ring-[#00a884] focus:ring-2"
                                />
                                <span className="ml-2 text-sm text-gray-700">Remember me</span>
                            </label>
                            <button
                                type="button"
                                className="text-sm text-[#00a884] hover:text-[#00b884] transition-colors font-medium"
                            >
                                Forgot password?
                            </button>
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
                                        Signing In...
                                    </>
                                ) : (
                                    <>
                                        Sign In
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
                            <span className="px-2 bg-white text-gray-500">New to our platform?</span>
                        </div>
                    </div>

                    {/* Signup Link */}
                    <div className="text-center">
                        <Link
                            href="/signup"
                            className="inline-flex items-center text-[#00a884] font-semibold hover:text-[#00b884] transition-colors group"
                        >
                            Create an account
                            <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="text-center mt-8 p-4 bg-white/50 rounded-2xl border border-gray-200/50 backdrop-blur-sm">
                    <div className="flex items-center justify-center mb-2">
                        <FaShieldAlt className="text-[#00a884] mr-2" />
                        <span className="text-sm font-medium text-gray-700">Secure & Encrypted</span>
                    </div>
                    <p className="text-xs text-gray-600">
                        Your conversations are protected with end-to-end encryption
                    </p>
                </div>
            </div>
        </div>
    );
}