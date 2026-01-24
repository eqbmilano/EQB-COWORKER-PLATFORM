import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`rounded-2xl border border-white/50 bg-white/70 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl p-6 ${className}`}
    >
      {children}
    </div>
  );
};
