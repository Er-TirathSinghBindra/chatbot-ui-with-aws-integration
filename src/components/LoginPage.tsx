import React, { useState } from 'react';
import { signIn, signUp, confirmSignUp, resetPassword, confirmResetPassword } from 'aws-amplify/auth';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

type AuthView = 'login' | 'signup' | 'confirm' | 'forgot-password' | 'reset-password';

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [view, setView] = useState<AuthView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Development mode bypass
    const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';
    const DEV_TEST_EMAIL = 'test@chatbot.com';
    const DEV_TEST_PASSWORD = 'TeSt@25';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Development mode - accept test credentials
            if (BYPASS_AUTH) {
                console.log('🔧 Development mode: Login bypass enabled');
                
                if (email === DEV_TEST_EMAIL && password === DEV_TEST_PASSWORD) {
                    console.log('✅ Test credentials accepted');
                    setMessage('Development mode: Login successful!');
                    // Store dev session
                    localStorage.setItem('dev_auth_session', 'authenticated');
                    setTimeout(() => {
                        onLoginSuccess();
                    }, 500);
                    return;
                } else {
                    setError(`Development mode: Use test credentials (${DEV_TEST_EMAIL} / ${DEV_TEST_PASSWORD})`);
                    setLoading(false);
                    return;
                }
            }

            // Production mode - use real Cognito
            await signIn({ username: email, password });
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await signUp({
                username: email,
                password,
                options: {
                    userAttributes: {
                        email,
                    },
                },
            });
            setMessage('Account created! Please check your email for the confirmation code.');
            setView('confirm');
        } catch (err: any) {
            setError(err.message || 'Failed to sign up');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await confirmSignUp({ username: email, confirmationCode });
            setMessage('Account confirmed! You can now sign in.');
            setView('login');
            setConfirmationCode('');
        } catch (err: any) {
            setError(err.message || 'Failed to confirm account');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await resetPassword({ username: email });
            setMessage('Password reset code sent to your email.');
            setView('reset-password');
        } catch (err: any) {
            setError(err.message || 'Failed to send reset code');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await confirmResetPassword({
                username: email,
                confirmationCode,
                newPassword: password,
            });
            setMessage('Password reset successful! You can now sign in.');
            setView('login');
            setPassword('');
            setConfirmPassword('');
            setConfirmationCode('');
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 animate-gradient-xy"></div>
            
            {/* Floating orbs for depth */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-20 left-40 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            
            <div className="max-w-md w-full relative z-10">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-lg rounded-full mb-4 border border-white/30 shadow-2xl animate-float">
                        <svg
                            className="w-10 h-10 text-white drop-shadow-lg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">Wall E</h1>
                    <p className="text-white/90 text-lg drop-shadow">
                        {view === 'login' && 'Sign in to your account'}
                        {view === 'signup' && 'Create a new account'}
                        {view === 'confirm' && 'Confirm your account'}
                        {view === 'forgot-password' && 'Reset your password'}
                        {view === 'reset-password' && 'Enter new password'}
                    </p>
                </div>

                {/* Glassmorphism Form Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
                    {/* Success Message */}
                    {message && (
                        <div className="mb-4 p-3 bg-green-400/20 backdrop-blur-sm border border-green-300/30 rounded-xl text-white text-sm shadow-lg">
                            {message}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-400/20 backdrop-blur-sm border border-red-300/30 rounded-xl text-white text-sm shadow-lg">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    {view === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-1">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setView('forgot-password')}
                                className="text-sm text-white/90 hover:text-white glass-link"
                            >
                                Forgot password?
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 disabled:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>

                            <div className="text-center text-sm text-white/80">
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setView('signup');
                                        setError(null);
                                        setMessage(null);
                                    }}
                                    className="text-white/90 hover:text-white glass-link font-medium"
                                >
                                    Sign up
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Sign Up Form */}
                    {view === 'signup' && (
                        <form onSubmit={handleSignUp} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-1">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all"
                                    placeholder="••••••••"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Must be at least 8 characters with uppercase, lowercase, and numbers
                                </p>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 disabled:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Creating account...' : 'Sign Up'}
                            </button>

                            <div className="text-center text-sm text-white/80">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setView('login');
                                        setError(null);
                                        setMessage(null);
                                    }}
                                    className="text-white/90 hover:text-white glass-link font-medium"
                                >
                                    Sign in
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Confirmation Form */}
                    {view === 'confirm' && (
                        <form onSubmit={handleConfirmSignUp} className="space-y-4">
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-white/90 mb-1">
                                    Confirmation Code
                                </label>
                                <input
                                    id="code"
                                    type="text"
                                    value={confirmationCode}
                                    onChange={(e) => setConfirmationCode(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all"
                                    placeholder="123456"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter the code sent to {email}
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 disabled:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Confirming...' : 'Confirm Account'}
                            </button>

                            <div className="text-center text-sm text-white/80">
                                <button
                                    type="button"
                                    onClick={() => setView('login')}
                                    className="text-white/90 hover:text-white glass-link font-medium"
                                >
                                    Back to sign in
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Forgot Password Form */}
                    {view === 'forgot-password' && (
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 disabled:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Sending code...' : 'Send Reset Code'}
                            </button>

                            <div className="text-center text-sm text-white/80">
                                <button
                                    type="button"
                                    onClick={() => setView('login')}
                                    className="text-white/90 hover:text-white glass-link font-medium"
                                >
                                    Back to sign in
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Reset Password Form */}
                    {view === 'reset-password' && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-white/90 mb-1">
                                    Confirmation Code
                                </label>
                                <input
                                    id="code"
                                    type="text"
                                    value={confirmationCode}
                                    onChange={(e) => setConfirmationCode(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all"
                                    placeholder="123456"
                                />
                            </div>

                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-white/90 mb-1">
                                    New Password
                                </label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-white/90 mb-1">
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirmNewPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-xl hover:bg-white/30 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 disabled:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Resetting password...' : 'Reset Password'}
                            </button>

                            <div className="text-center text-sm text-white/80">
                                <button
                                    type="button"
                                    onClick={() => setView('login')}
                                    className="text-white/90 hover:text-white glass-link font-medium"
                                >
                                    Back to sign in
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-white/80 mt-6">
                    Secured by AWS Cognito
                </p>
            </div>
        </div>
    );
};
