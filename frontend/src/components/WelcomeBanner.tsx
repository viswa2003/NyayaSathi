// src/components/WelcomeBanner.tsx
import React from 'react';

// This component receives one prop: a function to call when the "Get Help Now" button is clicked.
interface WelcomeBannerProps {
    onGetHelp: () => void;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onGetHelp }) => (
    <div className="bg-wave-gradient rounded-xl p-6 md:p-8 text-white shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold">Welcome to NyayaSathi</h1>
        <p className="mt-2 text-lg text-blue-100">Get instant legal advice and know your rights</p>
        <button
            onClick={onGetHelp}
            className="mt-6 fancy-button rounded-lg shadow-md"
        >
            <span className="relative z-10">Get Help Now</span>
        </button>
    </div>
);

export default WelcomeBanner;