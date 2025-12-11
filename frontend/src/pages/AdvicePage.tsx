// src/components/AdvicePage.tsx
import React, { useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import LawInfoModal from '../components/LawInfoModal';
import { useAuth } from '../context/AuthContext';

// Define an interface for the relevant section structure
// This should match the JSON structure from your backend
interface RelevantSection {
    act_name?: string;
    law_code?: string;
    section_number: string;
    section_title: string;
    simple_explanation: string;
    legal_text: string;
    punishment: string;
}

// Define an interface for the main advice object
interface AdviceData {
    legalInformation: string;
    punishment?: string; // Top-level punishment summary
    relevantSections: RelevantSection[];
    nextSteps: {
        suggestions: string;
        disclaimer: string;
    };
}

const AdvicePage: React.FC = () => {
    const location = useLocation();
    const { token, user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    // Get the advice data passed from DescribePage
    // We type-cast it to our interface
    const advice: AdviceData = location.state?.advice;
    const userProblem: string = location.state?.userProblem;
    const isSaved: boolean = location.state?.isSaved || false; // Flag indicating if this is a saved advice being viewed

    // If no advice data is present (e.g., user navigated here directly)
    // redirect them back to the describe page.
    if (!advice) {
        return <Navigate to="/describe" replace />;
    }

    const handleSaveAdvice = async () => {
        if (!token) {
            setSaveError('You must be logged in to save advice');
            return;
        }

        if (user?.role === 'guest') {
            setSaveError('Guest users cannot save advice. Please sign up to save your queries.');
            return;
        }

        if (!userProblem) {
            setSaveError('Unable to save: original query not found');
            return;
        }

        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            const response = await fetch('/api/saved-advice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userProblem,
                    legalInformation: advice.legalInformation,
                    punishment: advice.punishment || '',
                    relevantSections: advice.relevantSections,
                    nextSteps: advice.nextSteps
                })
            });

            if (!response.ok) {
                const error = await response.json();
                
                // Handle duplicate save (409 Conflict)
                if (response.status === 409) {
                    setSaveError('You have already saved advice for this query');
                    setSaveSuccess(false);
                } else {
                    throw new Error(error.message || 'Failed to save advice');
                }
                
                setSaving(false);
                return;
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 5000); // Clear success message after 5s
        } catch (error: any) {
            setSaveError(error.message || 'Failed to save advice');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Your Legal Information</h1>
            
            {/* Legal Information (from AI) */}
            <div className="bg-green-50 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Summary</h3>
                <p className="text-green-700 whitespace-pre-wrap">
                    {advice.legalInformation}
                </p>
            </div>

            {/* Punishment Summary (if available) */}
            {advice.punishment && (
                <div className="bg-red-50 p-6 rounded-lg shadow-sm border-l-4 border-red-600">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">⚖️ Applicable Punishment</h3>
                    <p className="text-red-700 whitespace-pre-wrap font-medium">
                        {advice.punishment}
                    </p>
                </div>
            )}

            {/* Relevant Laws (from Database) */}
                <RelevantSectionsCards sections={advice.relevantSections} />

            {/* Recommended Next Steps (from AI) */}
            <div className="bg-orange-50 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-orange-800 mb-3">Recommended Next Steps</h3>
                {/* Split suggestions by newlines or numbers and render as list */}
                <div className="text-orange-700 space-y-2">
                    {advice.nextSteps.suggestions.split(/\n+/).filter(line => line.trim()).map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                            <span className="font-semibold min-w-[24px]">{idx + 1}.</span>
                            <span>{step.replace(/^\d+\.\s*/, '')}</span>
                        </div>
                    ))}
                </div>
            </div>

             {/* Disclaimer (from AI) */}
             <div className="bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-300">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Disclaimer</h3>
                <p className="text-sm text-gray-600">
                    {advice.nextSteps.disclaimer}
                </p>
            </div>

            {/* Save Error/Success Messages */}
            {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {saveError}
                </div>
            )}

            {saveSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    ✓ Advice saved successfully!
                </div>
            )}

            {/* Only show save button if this is NOT already a saved advice */}
            {!isSaved && (
                <>
                    <button 
                        onClick={handleSaveAdvice}
                        disabled={saving || !token || user?.role === 'guest' || saveSuccess}
                        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : saveSuccess ? '✓ Saved' : 'Save Advice'}
                    </button>

                    {user?.role === 'guest' && (
                        <p className="text-sm text-gray-600 text-center">
                            Guest users cannot save advice. <a href="/signup" className="text-blue-600 hover:underline">Sign up</a> to save your queries.
                        </p>
                    )}
                </>
            )}

            {/* Show info message if viewing saved advice */}
            {isSaved && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-center">
                    📚 This advice is already saved in your library
                </div>
            )}
        </div>
    );
};

    // --- Subcomponent: Cards + Modal logic ---
    const RelevantSectionsCards: React.FC<{ sections: RelevantSection[] }> = ({ sections }) => {
        const [selected, setSelected] = React.useState<RelevantSection | null>(null);
        const [lawDetail, setLawDetail] = React.useState<any | null>(null);
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState<string | null>(null);
        const [isOpen, setIsOpen] = React.useState(false);

        const openModal = async (sec: RelevantSection) => {
            setSelected(sec);
            setIsOpen(true);
            setLoading(true);
            setError(null);
            setLawDetail(null);

            try {
                const params = new URLSearchParams();
                if (sec.law_code) params.append('law_code', sec.law_code);
                if (sec.act_name) params.append('act_name', sec.act_name);
                params.append('section_number', sec.section_number);

                const res = await fetch(`/api/laws/lookup?${params.toString()}`);
                if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(txt || `Failed to load law (${res.status})`);
                }
                const data = await res.json();
                setLawDetail(data);
            } catch (e: any) {
                setError(e?.message || 'Failed to load law details');
            } finally {
                setLoading(false);
            }
        };

        const closeModal = () => {
            setIsOpen(false);
            setSelected(null);
            setLawDetail(null);
            setError(null);
        };

        return (
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Relevant Laws & Sections</h3>
                {sections.length === 0 ? (
                    <div className="text-gray-600">No sections returned.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sections.map((sec, idx) => (
                            <button
                                key={idx}
                                onClick={() => openModal(sec)}
                                className="text-left border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="text-sm text-gray-500 mb-1">
                                    {(sec.act_name || 'Act')} • {(sec.law_code ? `${sec.law_code} ` : '')}{sec.section_number}
                                </div>
                                <div className="font-semibold text-gray-900 mb-1 line-clamp-2">{sec.section_title}</div>
                                <div className="text-gray-700 text-sm line-clamp-3">{sec.simple_explanation}</div>
                            </button>
                        ))}
                    </div>
                )}

                <LawInfoModal isOpen={isOpen} onClose={closeModal} law={lawDetail} loading={loading} error={error} />
            </div>
        );
    };

export default AdvicePage;