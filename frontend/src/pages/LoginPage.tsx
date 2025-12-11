// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScalesIcon } from '../components/icons';

// 1. IMPORT THE IMAGE with the correct name: loginpic.jpg
import loginImage from '../assets/loginpic.jpg'; 

// --- Reusable Components ---
const LoadingSpinner = ({ color = 'border-white' }: { color?: string }) => (
    <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${color} mx-auto`}></div>
);

const ErrorDisplay = ({ message }: { message: string | null }) => {
    if (!message) return null;
    return (
        <div role="alert" className="text-red-700 bg-red-100 p-3 my-4 rounded-md text-center text-sm border border-red-300">
            <strong>Error:</strong> {message}
        </div>
    );
};
// --- End Reusable Components ---


const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [isGuestLoading, setIsGuestLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Handle REGULAR form submission (Email/Password) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoginLoading || isGuestLoading) return;

        setIsLoginLoading(true);
        setError(null);

        if (!formData.email || !formData.password) {
            setError("Please enter both email and password.");
            setIsLoginLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Login failed. Please check your credentials.');
            }

            if (data.token && data.user) {
                login(data.token, data.user);
                const userRole = data.user.role?.toLowerCase();

                if (userRole === 'admin') {
                    navigate('/admin/dashboard', { replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            } else {
                throw new Error("Login response was successful but missing data.");
            }

        } catch (err: any) {
            setError(err.message || "An unexpected error occurred during login.");
            console.error("Login Error:", err);
        } finally {
            setIsLoginLoading(false);
        }
    };

    // --- Handle GUEST LOGIN button click ---
    const handleGuestLogin = async () => {
        if (isLoginLoading || isGuestLoading) return;
        setIsGuestLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/guest-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const text = await response.text();
            let data;
            
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse response:', text);
                throw new Error('Server returned invalid JSON');
            }

            if (!response.ok) {
                throw new Error(data?.message || `Request failed (${response.status})`);
            }

            if (!data?.token || !data?.user) {
                throw new Error('Response missing required data');
            }

            login(data.token, data.user);
            navigate('/', { replace: true });

        } catch (err: any) {
            setError(err.message || 'Failed to create guest session');
            console.error('Guest Login Error:', err);
        } finally {
            setIsGuestLoading(false);
        }
    };
    // --- END FIX ---


    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-4xl"> {/* Increased max-width for 2 columns */}
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    {/* <div className="flex justify-center">
                        <ScalesIcon className="h-12 w-12 text-blue-600" />
                    </div> */}
                    <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                        Sign in to NyayaSathi
                    </h2>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
                    
                    {/* THIS IS THE NEW SIDE-BY-SIDE CONTAINER */}
                    <div className="lg:grid lg:grid-cols-2 lg:gap-8 bg-white shadow-xl sm:rounded-lg overflow-hidden">
                        
                        {/* LEFT COLUMN: THE LOGIN FORM */}
                        <div className="py-8 px-4 sm:px-10 border-r border-gray-100">
                            {/* Display Error Message */}
                            <ErrorDisplay message={error} />

                            {/* Regular Login Form */}
                            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                                {/* Email Input */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                                    <div className="mt-1">
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                    <div className="mt-1">
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="current-password"
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Enter your password"
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div>
                                    <button
                                        type="submit"
                                        disabled={isLoginLoading || isGuestLoading}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {isLoginLoading ? <LoadingSpinner color="border-white" /> : 'Sign in'}
                                    </button>
                                </div>
                            </form>

                            {/* Divider and Guest Login */}
                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">or</span></div>
                                </div>
                            </div>

                            {/* Guest login button */}
                            <div className="mt-6">
                                <button
                                    onClick={handleGuestLogin}
                                    disabled={isLoginLoading || isGuestLoading}
                                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                >
                                     {isGuestLoading ? <LoadingSpinner color="border-gray-600" /> : 'Continue as Guest'}
                                </button>
                                <p className="mt-2 text-xs text-center text-gray-500">Guest access has limited features and usage.</p>
                            </div>

                            {/* Sign up option */}
                            <div className="mt-6 text-center">
                                <span className="text-sm text-gray-500">
                                    Don’t have an account?{' '}
                                    <Link
                                        to="/signup"
                                        className="font-medium text-blue-600 hover:text-blue-500"
                                    >
                                        Sign up for NyayaSathi
                                    </Link>
                                </span>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: THE IMAGE */}
                        <div className="block mt-6 lg:mt-0">
                            <img 
                                src={loginImage}
                                alt="Abstract legal concept art for Nyayasathi"
                                className="w-full h-64 sm:h-80 lg:h-full object-cover rounded-none lg:rounded-r-lg"
                                loading="lazy"
                                decoding="async"
                            />
                        </div>

                    </div>
                    {/* END NEW SIDE-BY-SIDE CONTAINER */}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;