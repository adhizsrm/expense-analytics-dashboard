import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { AxiosError } from 'axios';

interface AuthPageProps {
    onLogin: (token: string, user: any) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
    // Determine initial state based on URL parameters for token
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('resetToken');

    type AuthMode = 'login' | 'register' | 'forgot' | 'reset';
    const [mode, setMode] = useState<AuthMode>(resetToken ? 'reset' : 'login');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // For Reset functionality
    const [token] = useState(resetToken || '');

    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Clean up URL to hide tokens visually if we enter reset mode
    useEffect(() => {
        if (mode === 'reset' && resetToken) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [mode, resetToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            if (mode === 'login') {
                const response = await authAPI.login({ email, password });
                if (response.success) {
                    onLogin(response.data.token, response.data.user);
                }
            } else if (mode === 'register') {
                const response = await authAPI.register({ email, password });
                if (response.success) {
                    const loginResponse = await authAPI.login({ email, password });
                    if (loginResponse.success) {
                        onLogin(loginResponse.data.token, loginResponse.data.user);
                    }
                }
            } else if (mode === 'forgot') {
                const response = await authAPI.forgotPassword(email);
                if (response.success) {
                    setSuccessMsg(response.message || "Email sent successfully.");
                    // Dev purely: show the dev URL
                    if ((response as any).dev_only_reset_url) {
                        console.log("DEV RESET LINK:", (response as any).dev_only_reset_url);
                        setSuccessMsg(`DEV ONLY: Link generated in console.`);
                        // Or we can just log it, but showing it as error nicely helps testing quickly
                        setError("DEV RESET URL: " + (response as any).dev_only_reset_url);
                    }
                }
            } else if (mode === 'reset') {
                if (password !== confirmPassword) {
                    setError("Passwords do not match");
                    setLoading(false);
                    return;
                }
                const response = await authAPI.resetPassword(token, password);
                if (response.success) {
                    setSuccessMsg("Password reset successfully. You may now log in.");
                    setTimeout(() => {
                        setMode('login');
                        setPassword('');
                        setConfirmPassword('');
                        setSuccessMsg(null);
                        setError(null);
                    }, 2000);
                }
            }
        } catch (err) {
            const axErr = err as AxiosError<{ error?: string, errors?: { msg: string }[] }>;
            setError(axErr.response?.data?.error || axErr.response?.data?.errors?.[0]?.msg || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">
                        {mode === 'login' && 'Sign in to your account'}
                        {mode === 'register' && 'Start your journey'}
                        {mode === 'forgot' && 'Reset Password'}
                        {mode === 'reset' && 'Create New Password'}
                    </h2>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200" style={{ wordBreak: 'break-all' }}>
                        {error}
                    </div>
                )}
                {successMsg && !error && (
                    <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm border border-green-200">
                        {successMsg}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
                            <div>
                                <input
                                    type="email"
                                    required
                                    className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${mode === 'forgot' ? 'rounded-md' : 'rounded-t-md'}`}
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        )}
                        {(mode === 'login' || mode === 'register' || mode === 'reset') && (
                            <div>
                                <input
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder={mode === 'reset' ? 'New Password (min. 6 chars)' : 'Password (min. 6 chars)'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    minLength={6}
                                />
                            </div>
                        )}
                        {mode === 'reset' && (
                            <div>
                                <input
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    minLength={6}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading || (mode === 'reset' && password !== confirmPassword && confirmPassword.length > 0)}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Processing...' : (
                                mode === 'login' ? 'Sign In' :
                                    mode === 'register' ? 'Register' :
                                        mode === 'forgot' ? 'Send Reset Link' :
                                            'Reset Password'
                            )}
                        </button>
                    </div>

                    <div className="flex flex-col space-y-2 text-sm text-center">
                        {mode === 'login' && (
                            <>
                                <button type="button" className="font-medium text-indigo-600 hover:text-indigo-500" onClick={() => setMode('forgot')}>
                                    Forgot your password?
                                </button>
                                <button type="button" className="font-medium text-gray-600 hover:text-indigo-500" onClick={() => setMode('register')}>
                                    Need an account? Register
                                </button>
                            </>
                        )}
                        {mode === 'register' && (
                            <button type="button" className="font-medium text-indigo-600 hover:text-indigo-500" onClick={() => setMode('login')}>
                                Already have an account? Sign in
                            </button>
                        )}
                        {mode === 'forgot' && (
                            <button type="button" className="font-medium text-gray-600 hover:text-indigo-500" onClick={() => setMode('login')}>
                                Remembered it? Sign in
                            </button>
                        )}
                        {mode === 'reset' && (
                            <button type="button" className="font-medium text-gray-600 hover:text-indigo-500" onClick={() => setMode('login')}>
                                Back to login
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
