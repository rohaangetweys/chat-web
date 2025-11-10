'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { FaEnvelope, FaLock, FaComments } from 'react-icons/fa';
import { login } from '@/lib/firebaseServices';
import InputField from '@/components/auth/InputField';
import SubmitButton from '@/components/auth/SubmitButton';
import SwitchPage from '@/components/auth/SwitchPage';

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
            <div className="relative z-10 w-full max-w-md max-sm:scale-95">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4 max-sm:hidden">
                        <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#0084ff] to-[#00b884] rounded-2xl flex items-center justify-center shadow-lg">
                                <FaComments className="text-white text-2xl" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-4xl max-sm:text-3xl font-bold bg-gradient-to-r from-[#0084ff] to-[#00b884] bg-clip-text text-transparent mb-2 max-sm:mb-0">
                        Welcome Back
                    </h1>
                    <p className="text-gray-600 text-lg max-sm:text-xs">Sign in to continue your conversations</p>
                </div>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-8 transform hover:scale-[1.02] transition-all duration-300">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" Icon={FaEnvelope} required />

                        <InputField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" Icon={FaLock} required />

                        <SubmitButton loading={loading} loadingText="Signing In..." defaultText="Sign In" />
                    </form>
                    <SwitchPage dividerText={'New to our platform?'} linkTo={'/signup'} linkText={'Create an account'} />
                </div>
            </div>
        </div>
    );
}