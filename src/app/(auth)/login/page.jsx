'use client';
import { useState } from 'react';
import { login } from '@/lib/firebase';
import Link from 'next/link';
import { Toaster, toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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
        <div className="flex justify-center items-center h-screen bg-[#111b21]">
            <Toaster position="top-center" reverseOrder={false} />
            <div className="bg-[#202c33] rounded-2xl shadow-md p-8 w-96 border border-[#374248]">
                <h2 className="text-2xl font-bold text-center text-white mb-6">
                    Login to Chat App
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full mt-1 p-3 rounded-xl bg-[#111b21] text-white border border-[#374248] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full mt-1 p-3 rounded-xl bg-[#111b21] text-white border border-[#374248] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-[#00a884] text-white py-3 rounded-xl font-semibold transition ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#00b884]'
                            }`}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className="text-sm text-gray-400 text-center mt-6">
                    Don't have an account?{' '}
                    <Link
                        href="/signup"
                        className="text-[#00a884] font-semibold hover:underline"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
