// src/components/Header.tsx

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import the useAuth hook
import { PhoneIcon, BookmarkIcon, ArrowLeftIcon } from './icons'; // Assuming icons.tsx is in the same folder
import justiceIcon from '../assets/justice (2).png';
import EmergencyModal from './EmergencyModal';

const Header: React.FC = () => {
    // Get authentication status (user object) and logout function from the context
    const { user, logout, isLoading } = useAuth(); // Added isLoading
    const navigate = useNavigate();
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';
    const isSignupPage = location.pathname === '/signup';
    const hideTopRightIcons = isLoginPage || isSignupPage;
    const [isEmergencyModalOpen, setEmergencyModalOpen] = React.useState(false);

    const handleLogout = () => {
        logout(); // Call the logout function from context
        navigate('/login'); // Redirect to login page after logout
    };

    return (
        <header className="shadow-md sticky top-0 z-50" style={{ backgroundColor: '#0046FF' }}>
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Back button */}
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full text-white hover:bg-opacity-20 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                        title="Go back"
                    >
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>

                    {/* Logo/Brand link */}
                    <Link to="/" className="flex items-center cursor-pointer hover:opacity-90">
                        <img src={justiceIcon} alt="NyayaSathi" className="h-8 w-8" />
                        <span className="ml-2 text-2xl font-bold text-white tracking-wider">NyayaSathi</span>
                    </Link>

                    {/* Right-side navigation */}
                    <div className="flex items-center space-x-4">
                        {/* Emergency & Saved icons hidden on Login and Signup pages */}
                        {!hideTopRightIcons && (
                            <>
                                <button 
                                    title="Emergency & Helpline Numbers" 
                                    onClick={() => setEmergencyModalOpen(true)}
                                    className="p-2 rounded-full text-white hover:bg-opacity-20 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                                >
                                    <PhoneIcon className="h-6 w-6" />
                                </button>
                                <button 
                                    title={user?.role === 'guest' ? 'Sign up to save advice' : 'Saved Advice'}
                                    onClick={() => user?.role !== 'guest' && navigate('/saved-advice')}
                                    className="p-2 rounded-full text-white hover:bg-opacity-20 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300" 
                                    disabled={user?.role === 'guest'}
                                >
                                    <BookmarkIcon className={`h-6 w-6 ${user?.role === 'guest' ? 'text-blue-300' : ''}`} />
                                </button>
                            </>
                        )}

                        {/* Conditional Rendering based on login status */}
                        {isLoading ? (
                            // Show a simple loading indicator while checking auth state
                            <div className="h-6 w-20 bg-gray-600 rounded animate-pulse"></div>
                        ) : user ? (
                            // If user is logged in (could be guest or registered):
                            <>
                                <span className="text-sm font-medium text-gray-300 hidden sm:inline">
                                    Welcome, {user.username}! {user.role === 'guest' && '(Guest)'}
                                </span>
                                {user.role === 'guest' ? (
                                    // For guests, show a Sign in button that navigates to Login
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="fancy-button-small"
                                    >
                                        <span className="relative z-10">Sign in</span>
                                    </button>
                                ) : (
                                    // For registered users/admins, show Logout
                                    <button
                                        onClick={handleLogout}
                                        className="fancy-button-small"
                                    >
                                        <span className="relative z-10">Logout</span>
                                    </button>
                                )}
                            </>
                        ) : (
                            // If user is logged out:
                            <>
                                {!isLoginPage && (
                                    <Link
                                        to="/login"
                                        className="px-4 py-2 text-sm font-medium text-white hover:bg-opacity-20 hover:bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                                    >
                                        Login
                                    </Link>
                                )}
                                {!isSignupPage && (
                                    <Link
                                        to="/signup"
                                        className="px-4 py-2 text-sm font-medium text-gray-800 bg-white hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                                    >
                                        Register
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Emergency Modal */}
            <EmergencyModal 
                isOpen={isEmergencyModalOpen} 
                onClose={() => setEmergencyModalOpen(false)} 
            />
        </header>
    );
};

export default Header;