import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false }) => {
  return (
    <div 
      className={`
        glass-panel rounded-2xl p-6 
        transition-all duration-300 ease-out
        ${hoverEffect ? 'hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
