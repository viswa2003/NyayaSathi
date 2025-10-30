// src/components/Header.tsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import the useAuth hook
import { ScalesIcon, PhoneIcon, BookmarkIcon, ArrowLeftIcon } from './icons'; // Assuming icons.tsx is in the same folder

const Header: React.FC = () => {
    // Get authentication status (user object) and logout function from the context
    const { user, logout, isLoading } = useAuth(); // Added isLoading
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(); // Call the logout function from context
        navigate('/login'); // Redirect to login page after logout
    };

    return (
        <header className="bg-blue-600 shadow-md sticky top-0 z-50">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Back button */}
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300"
                        title="Go back"
                    >
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>

                    {/* Logo/Brand link */}
                    <Link to="/" className="flex items-center cursor-pointer hover:opacity-90">
                        <ScalesIcon className="h-8 w-8 text-white" />
                        <span className="ml-2 text-2xl font-bold text-white tracking-wider">NyayaSathi</span>
                    </Link>

                    {/* Right-side navigation */}
                    <div className="flex items-center space-x-4">
                        {/* Optional Icons (Consider hiding or disabling if user is guest) */}
                        <button title="Contact (Placeholder)" className="p-2 rounded-full text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300">
                            <PhoneIcon className="h-6 w-6" />
                        </button>
                        <button 
                            title={user?.role === 'guest' ? 'Sign up to save advice' : 'Saved Advice'}
                            onClick={() => user?.role !== 'guest' && navigate('/saved-advice')}
                            className="p-2 rounded-full text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300" 
                            disabled={user?.role === 'guest'}
                        >
                            <BookmarkIcon className={`h-6 w-6 ${user?.role === 'guest' ? 'text-blue-300' : ''}`} />
                        </button>

                        {/* Conditional Rendering based on login status */}
                        {isLoading ? (
                            // Show a simple loading indicator while checking auth state
                            <div className="h-6 w-20 bg-blue-500 rounded animate-pulse"></div>
                        ) : user ? (
                            // If user is logged in (could be guest or registered):
                            <>
                                <span className="text-sm font-medium text-blue-100 hidden sm:inline">
                                    Welcome, {user.username}! {user.role === 'guest' && '(Guest)'}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-white hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            // If user is logged out:
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-white hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;