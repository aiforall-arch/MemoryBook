import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Chrome } from 'lucide-react';
import { NeonButton } from '../UI/NeonButton';

type AuthMode = 'login' | 'signup' | 'forgot-password';

interface AuthFormProps {
    initialMode?: AuthMode;
    onAuth: (email: string, password?: string, mode?: 'login' | 'signup') => Promise<void>;
    onResetPassword: (email: string) => Promise<void>;
    onSocialLogin: (provider: 'google' | 'azure') => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export const AuthForm: React.FC<AuthFormProps> = ({
    initialMode = 'login',
    onAuth,
    onResetPassword,
    onSocialLogin,
    isLoading,
    error
}) => {
    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage(null);

        try {
            if (mode === 'forgot-password') {
                await onResetPassword(email);
                setSuccessMessage('Reset link sent! Please check your email.');
            } else {
                await onAuth(email, password, mode);
            }
        } catch (err: any) {
            // Error is handled via props
        }
    };

    return (
        <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative z-10">
            {/* Logo/Icon */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] mb-6 transition-transform hover:scale-110 duration-500">
                    <span className="text-white text-3xl font-bold">M</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                    {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Join MemoryBook' : 'Reset Password'}
                </h1>
                <p className="text-gray-400 text-sm">
                    {mode === 'login'
                        ? 'Enter the digital vault of memories.'
                        : mode === 'signup'
                            ? 'Start preserving your electric moments.'
                            : 'We\'ll send a magic link to your email.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full bg-[#0B0F1A]/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-purple-500 focus:outline-none transition-all focus:ring-1 focus:ring-purple-500/20"
                        />
                    </div>
                </div>

                {/* Password Field (only for login/signup) */}
                {mode !== 'forgot-password' && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Password</label>
                            {mode === 'login' && (
                                <button
                                    type="button"
                                    onClick={() => setMode('forgot-password')}
                                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    Forgot?
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[#0B0F1A]/50 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white focus:border-purple-500 focus:outline-none transition-all focus:ring-1 focus:ring-purple-500/20"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                )}

                {error && <p className="text-red-400 text-sm py-1 animate-pulse">{error}</p>}
                {successMessage && <p className="text-cyan-400 text-sm py-1">{successMessage}</p>}

                <NeonButton fullWidth type="submit" isLoading={isLoading}>
                    {mode === 'login' ? 'Enter MemoryBook' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                </NeonButton>
            </form>

            <div className="mt-8">
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#121425] px-2 text-gray-500">Or continue with</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => onSocialLogin('google')}
                        className="flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 text-sm font-medium hover:bg-white/10 transition-all hover:border-white/20"
                    >
                        <Chrome size={18} />
                        Google
                    </button>
                    <button
                        onClick={() => onSocialLogin('azure')}
                        className="flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 text-sm font-medium hover:bg-white/10 transition-all hover:border-white/20"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#f3f3f3" d="M1 1h10v10H1zM12 1h10v10H12zM1 12h10v10H1zM12 12h10v10H12z" />
                        </svg>
                        Microsoft
                    </button>
                </div>
            </div>

            <div className="mt-8 text-center">
                {mode === 'forgot-password' ? (
                    <button
                        onClick={() => setMode('login')}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mx-auto"
                    >
                        <ArrowLeft size={16} />
                        Back to Login
                    </button>
                ) : (
                    <p className="text-sm text-gray-500">
                        {mode === 'login' ? (
                            <>New to MemoryBook? <button onClick={() => setMode('signup')} className="text-cyan-400 hover:underline">Create account</button></>
                        ) : (
                            <>Already have an account? <button onClick={() => setMode('login')} className="text-cyan-400 hover:underline">Welcome back</button></>
                        )}
                    </p>
                )}
            </div>
        </div>
    );
};
