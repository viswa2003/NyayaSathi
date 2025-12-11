// src/components/BottomNav.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, ChatBubbleIcon, BookOpenIcon } from './icons';

const linkBase = 'flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium';
const inactive = 'text-gray-500 hover:text-blue-600';
const active = 'text-blue-600';

const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] z-40">
      <div className="max-w-7xl mx-auto px-2">
        <div className="flex">
          <NavLink
            to="/"
            className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="mt-1">Home</span>
          </NavLink>

          <NavLink
            to="/describe"
            className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
          >
            <ChatBubbleIcon className="w-6 h-6" />
            <span className="mt-1">Describe</span>
          </NavLink>

          <NavLink
            to="/library"
            className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
          >
            <BookOpenIcon className="w-6 h-6" />
            <span className="mt-1">Library</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
