import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200/90',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700 mb-1">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl sm:text-2xl font-bold text-[#002B49] leading-tight tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};

