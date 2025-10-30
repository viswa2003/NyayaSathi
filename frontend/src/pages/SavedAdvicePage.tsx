import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

interface SavedAdviceItem {
    _id: string;
    userProblem: string;
    legalInformation: string;
    punishment?: string;
    relevantSections: any[];
    nextSteps: {
        suggestions: string;
        disclaimer: string;
    };
    createdAt: string;
}

const SavedAdvicePage: React.FC = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [savedAdvices, setSavedAdvices] = useState<SavedAdviceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        if (user?.role === 'guest') {
            setError('Guest users cannot save advice. Please sign up to access this feature.');
            setLoading(false);
            return;
        }

        fetchSavedAdvices();
    }, [token, user]);

    const fetchSavedAdvices = async () => {
        try {
            const response = await fetch('/api/saved-advice', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch saved advice');
            }

            const data = await response.json();
            setSavedAdvices(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load saved advice');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this saved advice?')) return;

        try {
            const response = await fetch(`/api/saved-advice/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete');
            }

            // Remove from UI
            setSavedAdvices(prev => prev.filter(item => item._id !== id));
        } catch (err: any) {
            alert(err.message || 'Failed to delete advice');
        }
    };

    const handleView = (item: SavedAdviceItem) => {
        // Navigate to advice page with saved data and isSaved flag
        navigate('/advice', { 
            state: { 
                advice: {
                    legalInformation: item.legalInformation,
                    punishment: item.punishment,
                    relevantSections: item.relevantSections,
                    nextSteps: item.nextSteps
                },
                userProblem: item.userProblem,
                isSaved: true // Flag to indicate this is already saved
            } 
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto my-10 p-8 bg-red-50 border border-red-200 rounded-lg">
                <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
                <p className="text-red-700">{error}</p>
                {user?.role === 'guest' && (
                    <div className="mt-4">
                        <Link to="/signup" className="text-blue-600 hover:underline font-semibold">
                            Sign up now
                        </Link>
                        {' '}to save and access your legal advice history.
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto my-10 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Saved Legal Advice</h1>
                <Link 
                    to="/describe"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Get New Advice
                </Link>
            </div>

            {savedAdvices.length === 0 ? (
                <div className="bg-white p-12 rounded-lg shadow-sm text-center">
                    <p className="text-gray-600 text-lg mb-4">
                        You haven't saved any legal advice yet.
                    </p>
                    <Link 
                        to="/describe"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Get Legal Information
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {savedAdvices.map(item => (
                        <div 
                            key={item._id} 
                            className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                                        {item.userProblem.substring(0, 150)}
                                        {item.userProblem.length > 150 && '...'}
                                    </h3>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                        {item.legalInformation}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>
                                            📅 {new Date(item.createdAt).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                        <span>
                                            📚 {item.relevantSections.length} relevant section{item.relevantSections.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleView(item)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm whitespace-nowrap"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {savedAdvices.length > 0 && (
                <div className="text-center text-sm text-gray-500">
                    Total saved: {savedAdvices.length} {savedAdvices.length === 1 ? 'item' : 'items'}
                </div>
            )}
        </div>
    );
};

export default SavedAdvicePage;
