import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import type { Message } from '../types'; // This will now import all our new types
import { SendIcon, CloseIcon } from './icons';
import chatbotIcon from '../assets/chatbot.png';
import LawInfoModal from './LawInfoModal';
import { useAuth } from '../context/AuthContext';

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const { token, login } = useAuth();

    // Law details modal state (shared for all AI messages)
    const [isLawModalOpen, setIsLawModalOpen] = useState(false);
    const [lawDetail, setLawDetail] = useState<any | null>(null);
    const [lawLoading, setLawLoading] = useState(false);
    const [lawError, setLawError] = useState<string | null>(null);

    const openLawDetail = async (sec: Message['relevantSections'][number]) => {
        setIsLawModalOpen(true);
        setLawLoading(true);
        setLawError(null);
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
            setLawError(e?.message || 'Failed to load law details');
        } finally {
            setLawLoading(false);
        }
    };

    const closeLawDetail = () => {
        setIsLawModalOpen(false);
        setLawDetail(null);
        setLawError(null);
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Seed an introduction message when the chat opens fresh
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: 'intro',
                    sender: 'ai',
                    text: "Hello! I’m NyayaSathi, a legal information assistant for Indian law. Ask any legal question you have, and I’ll help with clear information. If needed, I can also point you to relevant sections of Indian law.",
                }
            ]);
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!userInput.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: userInput.trim() };
        setMessages(prev => [...prev, userMessage]);

        const problemToSolve = userInput;
        setUserInput('');
        setIsLoading(true);

        try {
            // Ensure we have a token; if not, attempt guest login transparently
            let authToken = token;
            if (!authToken) {
                try {
                    const guestRes = await fetch('/api/auth/guest-login', { method: 'POST' });
                    if (guestRes.ok) {
                        const guestData = await guestRes.json();
                        if (guestData?.token && guestData?.user) {
                            login(guestData.token, guestData.user);
                            authToken = guestData.token;
                        }
                    }
                } catch (_) {
                    // ignore guest login failure, will fall back to unauthorized error
                }
            }

            if (!authToken) {
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    sender: 'ai',
                    text: "You're not signed in. Please log in or continue as a guest to chat.",
                };
                setMessages(prev => [...prev, errorMessage]);
                return;
            }

            // Prepare chat history excluding the just-sent message (backend takes latest separately)
            const history = messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }));

            const response = await axios.post('/api/chat-rag', {
                message: problemToSolve,
                history,
                topK: 5
            }, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });

            const data = response.data || {};

            // Create an AI message with structured data (map `answer` -> `legalInformation` for UI reuse)
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: data.answer || 'I could not generate a response right now.',
                legalInformation: data.answer || '',
                relevantSections: data.relevantSections || [],
                nextSteps: data.nextSteps || undefined,
            };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("Error fetching API response:", error);
            const status = error?.response?.status;
            let text = "Sorry, I couldn't connect to the server. Please try again later.";
            if (status === 401) text = 'Your session has expired or you are not authorized. Please log in again.';
            else if (status === 404) text = 'I could not find relevant laws for that query. Try rephrasing or adding details.';
            else if (status === 429) text = 'Rate limit reached. Please wait a bit and try again.';

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col">
                <header className="flex items-center justify-between p-4 border-b">
                    {/* Header remains the same */}
                    <div className="flex items-center">
                        <img src={chatbotIcon} alt="Chatbot" className="h-6 w-6" />
                        <h2 className="text-xl font-bold text-gray-800 ml-2">NyayaSathi Legal Assistant</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </header>

                <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && (
                                <div className="bg-blue-600 p-1 rounded-full self-start">
                                    <img src={chatbotIcon} alt="AI" className="h-6 w-6" />
                                </div>
                            )}

                            {/* UPDATED RENDER LOGIC */}
                            {msg.sender === 'ai' && msg.relevantSections && msg.relevantSections.length > 0 ? (
                                // Inline AI response: summary + cards + next steps
                                <div className="bg-gray-100 p-4 rounded-lg max-w-xl text-gray-800 w-full">
                                    {/* Main Legal Information Summary */}
                                    <p className="mb-4 whitespace-pre-wrap">{msg.legalInformation}</p>

                                    {/* Relevant Sections as cards */}
                                    <div className="space-y-3 mb-4">
                                        <h3 className="font-bold text-lg flex items-center">Relevant Sections</h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {msg.relevantSections.map((sec, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => openLawDetail(sec)}
                                                    className="text-left bg-white p-3 rounded-md shadow-sm border hover:shadow-md transition-shadow"
                                                >
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        {(sec.act_name || 'Act')} • {(sec.law_code ? `${sec.law_code} ` : '')}{sec.section_number}
                                                    </div>
                                                    <div className="font-semibold text-blue-700">
                                                        {`Section ${sec.section_number}: ${sec.section_title}`}
                                                    </div>
                                                    <div className="mt-2 text-sm text-gray-700 line-clamp-3">{sec.simple_explanation}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Next Steps */}
                                    {msg.nextSteps && (
                                        <div className="space-y-3">
                                            <h3 className="font-bold text-lg">Suggested Next Steps</h3>
                                            {msg.nextSteps.suggestions && (
                                                <p className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-3 rounded-r-lg text-sm">{msg.nextSteps.suggestions}</p>
                                            )}
                                            {/* Disclaimer intentionally omitted from messages; shown globally below input */}
                                        </div>
                                    )}

                                    {/* Law detail modal */}
                                    <LawInfoModal isOpen={isLawModalOpen} onClose={closeLawDetail} law={lawDetail} loading={lawLoading} error={lawError} />
                                </div>
                            ) : (
                                // Otherwise, use the simple message bubble
                                <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            )}
                        </div>
                    ))}
                     {isLoading && (
                         <div className="flex items-start gap-3">
                            <div className="bg-blue-600 p-1 rounded-full">
                                <img src={chatbotIcon} alt="AI" className="h-6 w-6" />
                            </div>
                            <div className="max-w-md p-3 rounded-lg bg-gray-100 text-gray-800 rounded-bl-none">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                         </div>
                    )}
                </div>

                <footer className="p-4 border-t">
                    {/* Input row */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Describe your legal issue here..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-500"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!userInput.trim() || isLoading}
                            className="p-2 rounded-full text-white bg-blue-600 disabled:bg-blue-300 hover:bg-blue-700 transition-colors"
                        >
                            <SendIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Global disclaimer (small text) */}
                    <p className="mt-2 text-xs text-gray-500 text-center">
                        Disclaimer: NyayaSathi provides general legal information, not legal advice. Consult a qualified lawyer for advice specific to your situation.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default ChatModal;