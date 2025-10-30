// src/App.tsx

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import the providers and components
import { AuthProvider } from './context/AuthContext'; // Wraps the app
import ProtectedRoute from './components/ProtectedRoute'; // Protects routes
import Header from './components/Header'; // Your existing Header
import ChatModal from './components/ChatModal'; // Your existing ChatModal

// Import your page components
import HomePage from './pages/HomePage';
import DescribePage from './pages/DescribePage';
import LawLibraryPage from './pages/LawLibraryPage';
import AdvicePage from './pages/AdvicePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SectionDetailPage from './pages/SectionDetailPage';
import SavedAdvicePage from './pages/SavedAdvicePage';

// Import admin components
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageLawsPage from './pages/admin/ManageLawsPage';
import ViewUsersPage from './pages/admin/ViewUsersPage';
import FlaggedQueriesPage from './pages/admin/FlaggedQueriesPage';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

// Separate component to use useLocation hook
const AppContent: React.FC = () => {
    const [isChatModalOpen, setChatModalOpen] = React.useState(false);
    const handleOpenChat = () => setChatModalOpen(true);
    const location = useLocation();
    
    // Check if we're on an admin route
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* Don't show Header on admin routes as AdminLayout has its own */}
            {!isAdminRoute && <Header />}

            {/* Main content area */}
            {isAdminRoute ? (
                // Admin routes render without the main wrapper
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="manage-laws" element={<ManageLawsPage />} />
                        <Route path="users" element={<ViewUsersPage />} />
                        <Route path="flagged" element={<FlaggedQueriesPage />} />
                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    </Route>

                    <Route path="/" element={<ProtectedRoute><HomePage onOpenChat={handleOpenChat} /></ProtectedRoute>} />
                    <Route path="/describe" element={<ProtectedRoute><DescribePage /></ProtectedRoute>} />
                    <Route path="/advice" element={<ProtectedRoute><AdvicePage /></ProtectedRoute>} />
                    <Route path="/saved-advice" element={<ProtectedRoute><SavedAdvicePage /></ProtectedRoute>} />
                    <Route path="/library" element={<ProtectedRoute><LawLibraryPage /></ProtectedRoute>} />
                    <Route path="/laws/:id" element={<ProtectedRoute><SectionDetailPage /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            ) : (
                // Regular routes render with main wrapper
                <main className="flex-grow max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />

                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute requiredRole="admin">
                                    <AdminLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="manage-laws" element={<ManageLawsPage />} />
                            <Route path="users" element={<ViewUsersPage />} />
                            <Route path="flagged" element={<FlaggedQueriesPage />} />
                            <Route index element={<Navigate to="/admin/dashboard" replace />} />
                        </Route>

                        <Route path="/" element={<ProtectedRoute><HomePage onOpenChat={handleOpenChat} /></ProtectedRoute>} />
                        <Route path="/describe" element={<ProtectedRoute><DescribePage /></ProtectedRoute>} />
                        <Route path="/advice" element={<ProtectedRoute><AdvicePage /></ProtectedRoute>} />
                        <Route path="/saved-advice" element={<ProtectedRoute><SavedAdvicePage /></ProtectedRoute>} />
                        <Route path="/library" element={<ProtectedRoute><LawLibraryPage /></ProtectedRoute>} />
                        <Route path="/laws/:id" element={<ProtectedRoute><SectionDetailPage /></ProtectedRoute>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            )}

            <ChatModal
                isOpen={isChatModalOpen}
                onClose={() => setChatModalOpen(false)}
            />
        </div>
    );
};

export default App;