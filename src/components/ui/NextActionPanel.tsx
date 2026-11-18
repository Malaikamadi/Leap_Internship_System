import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface NextActionPanelProps {
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  tone?: 'navy' | 'amber' | 'emerald';
  className?: string;
}

export const NextActionPanel: React.FC<NextActionPanelProps> = ({
  eyebrow = 'Next Required Action',
  title,
  description,
  actionLabel,
  actionTo,
  tone = 'navy',
  className,
}) => {
  const toneClasses = {
    navy: 'bg-[#002B49]/[0.03] border-[#002B49]/20 border-l-[3px] border-l-[#002B49]',
    amber: 'bg-amber-50/70 border-amber-200 border-l-[3px] border-l-amber-600',
    emerald: 'bg-emerald-50/60 border-emerald-200 border-l-[3px] border-l-emerald-600',
  };

  const Icon = tone === 'amber' ? AlertTriangle : tone === 'emerald' ? CheckCircle2 : Compass;
  const iconColor =
    tone === 'amber'
      ? 'text-amber-700 bg-amber-100/80'
      : tone === 'emerald'
      ? 'text-emerald-700 bg-emerald-100/80'
      : 'text-[#002B49] bg-[#002B49]/10';

  return (
    <div
      className={cn(
        'rounded-lg border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4',
        toneClasses[tone],
        className
      )}
    >
      <div className="flex items-start gap-3.5 min-w-0">
        <div
          className={cn(
            'h-9 w-9 rounded-md flex items-center justify-center shrink-0 mt-0.5',
            iconColor
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {eyebrow}
          </p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">{title}</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>

      {actionLabel && actionTo && (
        <Link to={actionTo} className="shrink-0">
          <Button variant={tone === 'amber' ? 'primary' : 'secondary'} size="sm">
            <span>{actionLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      )}
    </div>
  );
};

