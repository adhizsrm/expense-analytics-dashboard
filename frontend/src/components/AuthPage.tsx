import { useState } from 'react';
import { authAPI } from '../services/api';
import { AxiosError } from 'axios';

interface AuthPageProps {
    onLogin: (token: string, user: any) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                const response = await authAPI.login({ email, password });
                if (response.success) {
                    onLogin(response.data.token, response.data.user);
                }
            } else {
                const response = await authAPI.register({ email, password });
                if (response.success) {
                    // Auto-login after registration
                    const loginResponse = await authAPI.login({ email, password });
                    if (loginResponse.success) {
                        onLogin(loginResponse.data.token, loginResponse.data.user);
                    }
                }
            }
        } catch (err) {
            const axErr = err as AxiosError<{ error?: string, errors?: { msg: string }[] }>;
            setError(axErr.response?.data?.error || axErr.response?.data?.errors?.[0]?.msg || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">
                        {isLogin ? 'Sign in to your account' : 'Start your journey'}
                    </h2>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                type="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password (min. 6 characters)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
                        </button>
                    </div>

                    <div className="text-sm text-center">
                        <button
                            type="button"
                            className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
