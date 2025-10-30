// src/pages/DescribePage.tsx

import React, { useState } from 'react';
// --- FIX: Add 'Link' to this import ---
import { useNavigate, Link } from 'react-router-dom';
// ------------------------------------
import { useAuth } from '../context/AuthContext'; // Import the useAuth hook

// Reusable components (consider moving to separate files)
const LoadingSpinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>;
const ErrorDisplay = ({ message, isGuestLimit }: { message: string | null, isGuestLimit?: boolean }) => {
    if (!message) return null;
    return (
        <div className={`p-3 my-2 rounded-md text-center text-sm ${isGuestLimit ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-red-100 text-red-600'}`}>
            <strong>{isGuestLimit ? 'Limit Reached:' : 'Error:'}</strong> {message}
            {isGuestLimit && (
                 <p className="mt-1">Please <Link to="/signup" className="font-semibold underline">register</Link> or <Link to="/login" className="font-semibold underline">log in</Link> for full access.</p>
            )}
        </div>
    );
};


const DescribePage: React.FC = () => {
    const { token, user } = useAuth(); // Get the token and user info from context
    const [issue, setIssue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isGuestLimitError, setIsGuestLimitError] = useState(false); // State for guest limit error
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true); // Show loading state
        setError(null); // Clear previous errors
        setIsGuestLimitError(false); // Clear guest limit error

        // Ensure token exists (should always exist if ProtectedRoute is used)
        if (!token) {
            setError("Authentication error. Please log in again.");
            setIsLoading(false);
            navigate('/login'); // Redirect to login if token somehow missing
            return;
        }

        try {
            // Call the RAG endpoint
            const response = await fetch('/api/rag-laws/laws', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Send the auth token (user or guest) in the Authorization header
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userProblem: issue }), // Send the user's input
            });

            const data = await response.json(); // Parse the JSON response

            if (!response.ok) {
                // Check specifically for the guest limit error (status 429)
                if (response.status === 429 && data.limitReached) {
                    setIsGuestLimitError(true);
                    setError(data.msg || 'Guest usage limit reached.');
                } else {
                    // Handle other errors from the backend
                    throw new Error(data.message || data.msg || 'Failed to get information. Please try again.');
                }
                // Stop further processing on error
                setIsLoading(false);
                return;
            }

            // On success (response.ok), navigate to the AdvicePage
            navigate('/advice', { state: { advice: data, userProblem: issue } });

        } catch (err: any) {
            // Set error state for network or other unexpected errors
            setError(err.message || "An unexpected network error occurred.");
            console.error("Describe Page Fetch Error:", err);
            setIsLoading(false); // Ensure loading stops on catch
        }
        // No finally block needed here as loading is set false within error checks or after navigation
    };

    // Determine if submit should be disabled
    const isSubmitDisabled = isLoading || !token || issue.trim().length < 20 || (user?.role === 'guest' && isGuestLimitError);


    return (
         <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto my-10 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Describe Your Situation</h1>
            <p className="text-gray-600">
                Tell us about your legal issue in simple words. We'll provide relevant information based on the Bharatiya Nyaya Sanhita (BNS).
                {user?.role === 'guest' && <span className="block text-sm text-yellow-600 mt-1"> (Guest access limited)</span>}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <label htmlFor="legal-issue" className="sr-only">Describe your legal issue</label>
                <textarea
                    id="legal-issue"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    rows={8}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" // Added focus:border
                    placeholder="Example: My neighbor built a wall encroaching on my property..."
                    required
                    minLength={20} // Added minLength for better quality input
                 />
                 <p className="text-xs text-gray-500 text-right">Minimum 20 characters.</p>

                {/* Display Error Message (handles both general and guest limit errors) */}
                <ErrorDisplay message={error} isGuestLimit={isGuestLimitError} />

                {/* Submit Button */}
                <button
                    type="submit"
                    // Disable button if loading, no token, or issue text is too short, or guest limit reached
                    disabled={isSubmitDisabled}
                    className="w-full flex justify-center bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? <LoadingSpinner /> : 'Get Legal Information'}
                </button>
            </form>
             <div className="bg-blue-50 border-l-4 border-blue-300 text-blue-800 p-4 rounded-r-lg mt-4">
                <p className="font-semibold">How it works:</p>
                <ul className="list-disc list-inside text-sm mt-1">
                    <li>Describe your situation clearly.</li>
                    <li>Our AI will analyze it against Indian laws (BNS).</li>
                    <li>Receive relevant sections, simple explanations, and general next steps.</li>
                    <li>This is informational only, not legal advice.</li>
                </ul>
            </div>
        </div>
    );
};

export default DescribePage;