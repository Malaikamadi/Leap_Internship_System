import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  noPadding = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-slate-200/90 shadow-subtle transition-colors',
        !noPadding && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'mb-4 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h3
      className={cn(
        'text-sm sm:text-[15px] font-bold text-[#002B49] tracking-tight font-display',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
};
