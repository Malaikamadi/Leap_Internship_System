import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-[#002B49] text-white border border-[#002B49] hover:bg-[#001f35] active:bg-[#001728] shadow-subtle',
    secondary:
      'bg-teal-700 text-white border border-teal-700 hover:bg-teal-800 active:bg-teal-900 shadow-subtle',
    outline:
      'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100',
    danger:
      'bg-rose-600 text-white border border-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-subtle',
    ghost:
      'text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-bold rounded-md gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm font-bold rounded-lg gap-2',
    lg: 'px-5 py-2.5 text-sm font-bold rounded-lg gap-2',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#002B49] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
