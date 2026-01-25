import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'glass' | 'solid' | 'subtle';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  variant = 'glass'
}) => {
  const variants = {
    glass: 'rounded-lg border border-white/20 bg-white/10 backdrop-blur-md shadow-lg hover:bg-white/15 transition-colors duration-200',
    solid: 'rounded-lg border border-slate-700 bg-slate-800 shadow-md',
    subtle: 'rounded-lg border-none bg-slate-800/50 backdrop-blur-sm shadow-sm',
  };

  return (
    <div className={`p-6 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};
