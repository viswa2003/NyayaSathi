// src/pages/SignupPage.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScalesIcon } from '../components/icons'; // Assuming icons.tsx is in components folder

// Reusable components (consider moving to separate files)
const LoadingSpinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>;
const ErrorDisplay = ({ message }: { message: string | null }) => {
    if (!message) return null;
    return (
        <div className="text-red-600 bg-red-100 p-3 my-2 rounded-md text-center text-sm">
            <strong>Error:</strong> {message}
        </div>
    );
};

const SignupPage: React.FC = () => {
    // State for form fields, loading, error, and success message
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null); // For success message
    const navigate = useNavigate();

    // Update form state on input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        setSuccess(null); // Clear previous success message

        // --- Frontend Validation ---
        if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
             setError('Please enter a valid email address.');
             return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        // --- End Validation ---

        setIsLoading(true); // Show loading indicator

        try {
            // --- FIX: Use the full API URL ---
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Only send necessary fields to backend
                body: JSON.stringify({
                    username: formData.username.trim(), // Trim whitespace
                    email: formData.email.trim(),
                    password: formData.password // Send plain password
                }),
            });
            // --- END FIX ---

            const data = await response.json(); // Parse the JSON response

            if (!response.ok) {
                // If response status is not 2xx, throw an error
                throw new Error(data.msg || 'Registration failed. Please try again.');
            }

            // On successful registration (response.ok):
            setSuccess(data.msg || "Registration successful! Redirecting to login..."); // Show success message

            // Redirect to the login page after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 2500); // 2.5-second delay

        } catch (err: any) {
            // Set error state to display the message
            setError(err.message || "An unexpected error occurred during registration.");
            console.error("Signup Error:", err);
        } finally {
            setIsLoading(false); // Hide loading indicator
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* <div className="flex justify-center">
                    <ScalesIcon className="h-12 w-12 text-blue-600" />
                </div> */}
                <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                    Create your NyayaSathi account
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {/* Conditionally render success message or the form */}
                    {success ? (
                        <div className="text-center p-4">
                            <h3 className="text-lg font-semibold text-green-700">Registration Successful!</h3>
                            <p className="text-gray-600 mt-2">{success}</p>
                            {/* Optional: Add a spinner while waiting for redirect */}
                        </div>
                    ) : (
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {/* Username Input */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                                <input id="username" name="username" type="text" required value={formData.username} onChange={handleChange} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Choose a username" />
                            </div>

                            {/* Email Input */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                                <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="you@example.com" />
                            </div>

                            {/* Password Input */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Min. 6 characters" />
                            </div>

                            {/* Confirm Password Input */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                <input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Re-enter your password" />
                            </div>

                            {/* Display Error Message */}
                            <ErrorDisplay message={error} />

                            {/* Submit Button */}
                            <div>
                               <button
                                    type="submit"
                                    disabled={isLoading} // Disable button while loading
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? <LoadingSpinner/> : 'Create account'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Link to Login Page */}
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Already have an account?</span></div>
                        </div>
                        <div className="mt-6">
                            <Link to="/login" className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Sign in to NyayaSathi
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;