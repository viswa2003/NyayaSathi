// src/pages/admin/AdminLayout.tsx
import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-slate-100">
            {/* Fixed Full-Height Sidebar (Deep Navy) */}
            <aside className="fixed left-0 top-0 h-full w-72 sidebar flex flex-col shadow-xl" style={{ backgroundColor: '#1E659A' }}>
                {/* App Title */}
                <div className="px-6 py-6">
                    <div className="text-2xl font-extrabold text-white tracking-wide">
                        Nyayasathi
                    </div>
                </div>
                
                {/* Navigation Links */}
                <nav className="flex-1 px-4 space-y-2 text-sm font-semibold overflow-y-auto">
                    <NavLink
                        to="/admin/dashboard"
                        className={({ isActive }) =>
                            `relative flex items-center p-3 rounded-xl transition duration-200 ${
                                isActive
                                    ? 'text-white bg-white/10 before:content-[\'\'] before:absolute before:left-0 before:top-[calc(50%+6px)] before:-translate-y-1/2 before:h-6 before:w-1.5 before:rounded-r-full before:bg-[#FFC300]'
                                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }`
                        }
                    >
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 mr-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6m-6 0v-4m0 4h6m-6 0v-4" /></svg>
                        </span>
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/admin/manage-laws"
                        className={({ isActive }) =>
                            `relative flex items-center p-3 rounded-xl transition duration-200 ${
                                isActive
                                    ? 'text-white bg-white/10 before:content-[\'\'] before:absolute before:left-0 before:top-[calc(50%+6px)] before:-translate-y-1/2 before:h-6 before:w-1.5 before:rounded-r-full before:bg-[#FFC300]'
                                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }`
                        }
                    >
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 mr-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.8 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.8 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.2 18 16.5 18s-3.332.477-4.5 1.253" /></svg>
                        </span>
                        Manage Laws
                    </NavLink>

                    <NavLink
                        to="/admin/users"
                        className={({ isActive }) =>
                            `relative flex items-center p-3 rounded-xl transition duration-200 ${
                                isActive
                                    ? 'text-white bg-white/10 before:content-[\'\'] before:absolute before:left-0 before:top-[calc(50%+6px)] before:-translate-y-1/2 before:h-6 before:w-1.5 before:rounded-r-full before:bg-[#FFC300]'
                                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }`
                        }
                    >
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 mr-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2a3 3 0 015.356-1.857M7 20h4m-4 0h4m4 0h4m-9-4h6m-3 0v-6a4 4 0 10-4 4" /></svg>
                        </span>
                        View Users
                    </NavLink>
                </nav>

                {/* Logout Button at Bottom */}
                <div className="border-t border-white/10 px-4 py-4">
                    <button 
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition duration-200"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Content Area with Left Margin */}
            <section className="ml-72 flex-1 overflow-y-auto">
                <div className="p-6">
                    <Outlet />
                </div>
            </section>
        </div>
    );
};

export default AdminLayout;


