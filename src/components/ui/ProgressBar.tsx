import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  valueLabel?: string;
  tone?: 'navy' | 'teal' | 'emerald' | 'amber';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  label,
  valueLabel,
  tone = 'teal',
  className,
}) => {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.max(0, Math.min(100, Math.round((value / safeMax) * 100)));

  const fillStyles = {
    navy: 'bg-[#002B49]',
    teal: 'bg-teal-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || valueLabel) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          {label && <span className="font-medium text-slate-600">{label}</span>}
          {valueLabel && (
            <span className="font-semibold text-slate-900 tabular-nums">{valueLabel}</span>
          )}
        </div>
      )}
      <div
        className="h-2 w-full rounded-sm bg-slate-100 overflow-hidden border border-slate-200/70"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div
          className={cn(
            'h-full rounded-sm transition-all duration-500 ease-out',
            fillStyles[tone]
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

