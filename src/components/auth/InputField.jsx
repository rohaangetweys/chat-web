'use client';
import React from 'react';

export default function InputField({ label = 'asd', type = 'text', value, onChange, placeholder, Icon, required = false, }) {
    return (
        <div className="group">
            {label && (
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon className="text-[#00a884] z-50 group-focus-within:text-[#00b884] transition-colors" />
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    className="w-full pl-10 pr-4 py-4 rounded-2xl max-sm:py-2 max-sm:rounded-xl max-sm:text-sm 
                     bg-gray-50/80 border border-gray-300 text-gray-800 placeholder-gray-500 
                     focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent 
                     transition-all duration-300 backdrop-blur-sm"
                />
            </div>
        </div>
    );
}
