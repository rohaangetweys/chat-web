'use client';
import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaLock, FaComments, FaCamera, FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
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
    const [currentStep, setCurrentStep] = useState(1);
    const [signupError, setSignupError] = useState(null);
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

    const validateStep1 = () => {
        if (!username.trim()) {
            toast.error('Please enter a username');
            return false;
        }
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            toast.error('Username can only contain letters, numbers, and underscores');
            return false;
        }
        if (username.length < 3 || username.length > 20) {
            toast.error('Username must be between 3 and 20 characters');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            toast.error('Please enter your email');
            return false;
        }
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address');
            return false;
        }
        return true;
    };

    const validateStep3 = () => {
        if (!password.trim()) {
            toast.error('Please enter a password');
            return false;
        }
        if (password.length < 6) {
            toast.error('Password should be at least 6 characters');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        setSignupError(null);

        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setSignupError(null);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (currentStep < 3) {
                handleNext();
            } else {
                handleFinalSubmit(e);
            }
        }
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep3()) return;

        setLoading(true);
        setSignupError(null);
        const res = await signup(email, password, username, profilePhoto);
        setLoading(false);

        if (!res.success) {
            let errorMessage = 'Signup failed. Please try again.';

            switch (res.message) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Email already in use';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password should be at least 6 characters';
                    break;
                case 'username-already-exists':
                    errorMessage = 'Username already taken';
                    setSignupError('username-taken');
                    setCurrentStep(1);
                    break;
                default:
                    errorMessage = 'Signup failed. Please try again.';
            }
            toast.error(errorMessage);
        } else {
            toast.success('Signup successful!');
            router.push('/');
        }
    };

    const renderStepIndicator = () => (
        <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2">
                {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${step === currentStep
                            ? 'bg-gradient-to-r from-[#0084ff] to-[#0084ff] text-white shadow'
                            : step < currentStep
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}>
                            {step}
                        </div>
                        {step < 3 && (
                            <div className={`w-4 h-1 mx-1 transition-all duration-300 ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                                }`} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        {signupError === 'username-taken' && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                <div className="flex items-center text-red-800">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                    <span className="text-sm font-medium">Username already taken. Please choose a different one.</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col items-center">
                            <div
                                className="relative group cursor-pointer"
                                onClick={handleProfilePhotoClick}
                            >
                                <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-white shadow flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-[#0084ff]">
                                    {profilePhotoUrl ? (
                                        <Image
                                            src={profilePhotoUrl}
                                            alt="Profile preview"
                                            width={80}
                                            height={80}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                console.error('Image load error');
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-[#0084ff] transition-colors">
                                            <FaCamera size={20} />
                                            <span className="text-[10px] mt-0.5">Add Photo</span>
                                        </div>
                                    )}
                                </div>

                                {profilePhotoUrl && (
                                    <button
                                        type="button"
                                        onClick={removeProfilePhoto}
                                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors z-10 text-xs"
                                    >
                                        <FaTimes size={10} />
                                    </button>
                                )}

                                {uploadingPhoto && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            <input type="file" ref={fileInputRef} onChange={handleProfilePhotoChange} accept="image/*" className="hidden" />

                            <p className="text-xs text-gray-500 mt-1 text-center max-w-xs">
                                Click to upload profile photo (optional)<br />
                                <span className="text-[#0084ff] text-[10px]">Max 5MB • JPEG, PNG</span>
                            </p>
                        </div>

                        <InputField label="Username" type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} onKeyPress={handleKeyPress} placeholder="Choose a username" Icon={FaUser} required />
                        <p className="text-xs text-gray-500 -mt-2 max-sm:text-[10px]">3-20 characters, letters, numbers, and underscores only</p>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyPress={handleKeyPress} placeholder="Enter your email" Icon={FaEnvelope} required />
                        <p className="text-xs text-gray-500 -mt-2 max-sm:text-[10px]">
                            We'll send a verification email to this address
                        </p>
                    </div>
                );

            case 3:
                return (
                    <form onSubmit={handleFinalSubmit} className="space-y-4">
                        <InputField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={handleKeyPress} placeholder="Create a strong password" Icon={FaLock} required />

                        <div className="flex justify-between space-x-3">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-300 font-medium text-sm shadow-sm hover:shadow flex-1"
                            >
                                <FaArrowLeft className="mr-1.5 text-xs" />
                                Back to Email
                            </button>

                            <div className="flex-1">
                                <SubmitButton loading={loading} uploadingPhoto={uploadingPhoto} loadingText="Creating Account..." uploadingText="Uploading Photo..." defaultText="Complete Signup" />
                            </div>
                        </div>
                    </form>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 relative overflow-hidden w-full">
            <div className="relative z-10 w-full max-w-md max-sm:max-w-2xl">
                <div className="text-center mb-6 max-sm:mb-4">
                    <div className="flex justify-center mb-3 max-sm:mb-2">
                        <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#0084ff] to-[#0084ff] rounded-xl flex items-center justify-center shadow">
                                <FaComments className="text-white text-lg" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-2xl max-sm:text-xl font-bold bg-gradient-to-r from-[#0084ff] to-[#0084ff] bg-clip-text text-transparent mb-1">
                        Create Account
                    </h1>
                    <p className="text-gray-600 text-sm max-sm:text-xs">
                        Step {currentStep} of 3 - {
                            currentStep === 1 ? 'Profile Setup' :
                                currentStep === 2 ? 'Contact Info' :
                                    'Security'
                        }
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-6">
                    {renderStepIndicator()}

                    {renderStepContent()}

                    {currentStep < 3 && (
                        <div className="flex justify-between mt-6 space-x-3">
                            {currentStep > 1 ? (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-300 font-medium text-sm shadow-sm hover:shadow"
                                >
                                    <FaArrowLeft className="mr-1.5 text-xs" />
                                    Back
                                </button>
                            ) : (
                                <div></div>
                            )}

                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-[#0084ff] to-[#0084ff] text-white rounded-lg hover:shadow transition-all duration-300 font-medium text-sm shadow-md"
                            >
                                Next
                                <FaArrowRight className="ml-1.5 text-xs" />
                            </button>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="mt-4">
                            <SwitchPage dividerText={'Already have an account?'} linkTo={'/login'} linkText={'Sign in to your account'} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}