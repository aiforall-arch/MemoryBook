import React from 'react';

interface WelcomeScreenProps {
    onLogin: () => void;
}

/**
 * WelcomeScreen - Landing page matching the user's design
 * Shows before the login/signup form
 */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLogin }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0F1A] p-6 relative overflow-hidden">
            {/* Abstract Background Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[100px]"></div>
            <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-pink-600/10 rounded-full blur-[80px]"></div>

            {/* Content */}
            <div className="relative z-10 text-center w-full max-w-md">
                {/* Title with gradient - larger font for desktop */}
                <h1 className="text-5xl md:text-6xl font-bold italic leading-tight mb-8">
                    <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-purple-600 bg-clip-text text-transparent block">
                        Welcome to
                    </span>
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent block mt-1">
                        Memorybook
                    </span>
                </h1>

                {/* Tagline - proper gray color */}
                <p className="text-gray-400 text-base md:text-lg mb-12 leading-relaxed px-2">
                    Share your precious moments with friends and family. Every memory tells a story.
                </p>

                {/* Buttons Container */}
                {/* Login / Sign Up Button - Primary Action */}
                <button
                    onClick={onLogin}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl text-white font-semibold text-lg shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                    Login / Sign Up
                </button>
            </div>
        </div>
    );
};
