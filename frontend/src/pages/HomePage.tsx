import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import WelcomeBanner from '../components/WelcomeBanner';
import ActionCard from '../components/ActionCard';
import CategoryCard from '../components/CategoryCard';
import DescribeIllustration from '../assets/illustrations/describe (2).svg';
import ChatbotIllustration from '../assets/illustrations/Chat bot-bro.svg';
import LibraryIllustration from '../assets/illustrations/Documents-bro.svg';
import {
    ChatBubbleIcon, BookOpenIcon, ClockIcon, EmergencyIcon,
    HomeIcon, HeartIcon, BriefcaseIcon, CarIcon, ShieldIcon,
    CartIcon, LightbulbIcon, MobilePhoneIcon
} from '../components/icons';

interface HomePageProps {
    onOpenChat: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onOpenChat }) => {
    // This is the same data from your App.tsx
    const quickActions = [
        {
            icon: <ChatBubbleIcon className="w-6 h-6 text-white" />,
            title: "Describe Issue",
            description: "Tell us your legal problem",
            color: "bg-blue-100",
            href: "/describe",
            frontGradient: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)", // purple
            backGradient: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",   // deep purple
            illustrationSrc: DescribeIllustration,
            illustrationAlt: "Describe your issue"
        },
        {
            icon: <ChatBubbleIcon className="w-6 h-6 text-white" />,
            title: "Chatbot",
            description: "Chat with NyayaSathi",
            color: "bg-indigo-100",
            onClick: onOpenChat,
            frontGradient: "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)", // blue
            backGradient: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",   // dark blue
            illustrationSrc: ChatbotIllustration,
            illustrationAlt: "Chatbot illustration"
        },
        {
            icon: <BookOpenIcon className="w-6 h-6 text-white" />,
            title: "Law Library",
            description: "Browse legal topics",
            color: "bg-green-100",
            href: "/library",
            frontGradient: "linear-gradient(135deg, #34d399 0%, #059669 100%)", // emerald
            backGradient: "linear-gradient(135deg, #059669 0%, #047857 100%)",   // dark emerald
            illustrationSrc: LibraryIllustration,
            illustrationAlt: "Law library illustration"
        }
        // Future actions can be added here
    ];

    const popularCategories = [
        { icon: <ShieldIcon className="w-6 h-6 text-blue-500" />, name: "Criminal Law", color: "bg-blue-100" },
        { icon: <MobilePhoneIcon className="w-6 h-6 text-rose-500" />, name: "Cybercrime", color: "bg-rose-100" },
        { icon: <HeartIcon className="w-6 h-6 text-pink-500" />, name: "Family & Personal Law", color: "bg-pink-100" },
        { icon: <CartIcon className="w-6 h-6 text-emerald-500" />, name: "Consumer Protection & E-Commerce Law", color: "bg-emerald-100" },
        { icon: <BriefcaseIcon className="w-6 h-6 text-indigo-500" />, name: "Labour and Employment Law", color: "bg-indigo-100" },
        { icon: <CarIcon className="w-6 h-6 text-yellow-500" />, name: "Traffic", color: "bg-yellow-100" },
    ];
    
    return (
        <div className="space-y-12">
            {/* "Get Help Now" button still opens the chat modal */}
            <WelcomeBanner onGetHelp={onOpenChat} />

            <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-3 gap-6">
                    {quickActions.map(action => (
                        // If the action has an 'href', wrap it in a Link.
                        // Otherwise, use the onClick for the chat modal.
                        action.href ? (
                            <Link to={action.href} key={action.title}>
                                <ActionCard
                                    {...action}
                                    className="h-30 border border-gray-200 hover:border-blue-500 transition-colors duration-300"
                                />
                            </Link>
                        ) : (
                            <ActionCard 
                                key={action.title} 
                                {...action}
                                className="h-30 border border-gray-200 hover:border-blue-500 transition-colors duration-300"
                                // This makes your "Describe Issue" button (which now navigates)
                                // and your "Get Help Now" button (which opens chat) work differently.
                                // BUT wait, your prompt says "Describe Issue" should go to a new page.
                                // The code above handles this.
                                // Let's fix the "Describe Issue" onClick from your original file.
                                // We'll make it so only "Get Help Now" opens the chat.
                                // ...Ah, wait. Your original App.tsx has "Describe Issue" opening the chat.
                                // Your *new* request is to change this.
                                // This code correctly separates them:
                                // "Get Help Now" uses onOpenChat.
                                // "Describe Issue" uses <Link to="/describe">.
                                // This is what you want!
                            />
                        )
                    ))}
                    {/* A cleaner way to handle the actions: */}
                    {/* <Link to="/describe">
                        <ActionCard {...quickActions[0]} />
                    </Link>
                    <Link to="/library">
                        <ActionCard {...quickActions[1]} />
                    </Link>
                    <ActionCard {...quickActions[2]} />
                    <ActionCard {...quickActions[3]} />
                    */}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Popular Categories</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
                    {popularCategories.map(cat => (
                        <Link key={cat.name} to={`/library?category=${encodeURIComponent(cat.name)}`}>
                            <CategoryCard {...cat} />
                        </Link>
                    ))}
                </div>
            </section>
            
            <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-r-lg flex items-start space-x-3">
                <LightbulbIcon className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                     <p className="font-bold">Quick Tip</p>
                     <p>Always keep documents ready when seeking legal advice. Screenshots and records can be crucial evidence.</p>
                </div>
            </div>
        </div>
    );
};

export default HomePage;