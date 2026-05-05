import React from 'react';

interface CyberCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const CyberCard: React.FC<CyberCardProps> = ({ children, className = '', glow = false }) => {
  return (
    <div
      className={`bg-black border border-[#00FFFF] ${glow ? 'shadow-[0_0_20px_rgba(0,255,255,0.3)]' : ''} ${className}`}
      style={{
        boxShadow: glow ? '0 0 20px rgba(0, 255, 255, 0.3)' : 'none'
      }}
    >
      {children}
    </div>
  );
};
