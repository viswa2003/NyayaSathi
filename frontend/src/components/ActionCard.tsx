// src/components/ActionCard.tsx
import React from 'react';

interface ActionCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
    onClick?: () => void;
    square?: boolean;
    className?: string;
    frontGradient?: string; // Custom gradient for front face
    backGradient?: string;  // Custom gradient for back face
    illustrationSrc?: string; // Optional illustration for the back face
    illustrationAlt?: string; // Optional alt text for illustration
}

const ActionCard: React.FC<ActionCardProps> = ({ 
    icon, 
    title, 
    description, 
    color, 
    onClick, 
    square = false, 
    className,
    frontGradient = 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)',
    backGradient = 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    illustrationSrc,
    illustrationAlt
}) => {
    const Container: React.ElementType = onClick ? 'button' : 'div';

    return (
        <Container
            onClick={onClick}
            className={`flip-card ${className || ''}`}
            {...(onClick ? { type: 'button' } : {})}
        >
            <div className="flip-card-inner">
                {/* Front Face - Icon removed; title + larger illustration + description */}
                <div className="flip-card-front gradient-wave" style={{ background: frontGradient }}>
                    <h3 className="text-lg font-bold text-white mb-2 text-center">{title}</h3>
                    {illustrationSrc && (
                        <img
                            src={illustrationSrc}
                            alt={illustrationAlt || `${title} illustration`}
                            className="w-32 h-32 object-contain mb-3"
                            loading="lazy"
                        />
                    )}
                    <p className="text-white text-center text-xs leading-relaxed px-2">
                        {description}
                    </p>
                </div>
            </div>
        </Container>
    );
};

export default ActionCard;