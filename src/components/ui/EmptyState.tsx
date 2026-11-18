import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-8 px-4 border border-dashed border-slate-200 rounded-lg bg-slate-50/50',
        className
      )}
    >
      <div className="h-10 w-10 rounded-md bg-white border border-slate-200 text-slate-400 flex items-center justify-center mb-3 shadow-subtle">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

