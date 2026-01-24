import React from 'react';
import Link from 'next/link';

interface BaseButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface ButtonAsButton extends BaseButtonProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  href?: never;
}

interface ButtonAsLink extends BaseButtonProps {
  href: string;
  children: React.ReactNode;
  onClick?: never;
  type?: never;
  disabled?: never;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', href, ...props }, ref) => {
    const variantClasses = {
      primary:
        'bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 text-white shadow-lg hover:shadow-xl hover:brightness-105',
      secondary:
        'bg-white/80 text-slate-900 border border-white/60 shadow-sm hover:bg-white hover:shadow-md',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      outline:
        'bg-transparent border-2 border-white/60 text-slate-900 hover:border-white hover:bg-white/60',
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const classes = `inline-block text-center font-semibold rounded-xl transition-all duration-200 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    if (href) {
      return (
        <Link href={href} className={classes}>
          {props.children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        className={classes}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      />
    );
  }
);

Button.displayName = 'Button';
