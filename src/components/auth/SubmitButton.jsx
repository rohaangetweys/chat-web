import React from 'react';
import { FaArrowRight } from 'react-icons/fa';

const SubmitButton = ({ loading = false, uploadingPhoto = false, loadingText = 'Processing...', uploadingText = 'Uploading...', defaultText, className = '', disabled = false, icon }) => {
    const isDisabled = disabled || loading || uploadingPhoto;

    return (
        <button
            type="submit"
            disabled={isDisabled}
            className={`w-full max-sm:py-3 group relative overflow-hidden bg-gradient-to-r from-[#0084ff] to-[#0084ff] text-white py-4 rounded-2xl font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl ${isDisabled
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:from-[#0084ff] hover:to-[#0084ff]'
                } ${className}`}
        >
            <span className="relative z-10 flex items-center justify-center">
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {loadingText}
                    </>
                ) : uploadingPhoto ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {uploadingText}
                    </>
                ) : (
                    <>
                        {icon}
                        {defaultText}
                        <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0084ff] to-[#0084ff] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
    );
};

export default SubmitButton;