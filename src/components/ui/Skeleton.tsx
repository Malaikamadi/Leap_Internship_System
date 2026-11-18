import React from 'react';
import { cn } from '../../lib/utils';

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded bg-slate-200/80', className)} aria-hidden="true" />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6" role="status" aria-label="Loading workspace data">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="h-7 w-64" />
        <SkeletonBlock className="h-3.5 w-80" />
      </div>
      <div className="flex gap-2">
        <SkeletonBlock className="h-9 w-24 rounded-md" />
        <SkeletonBlock className="h-9 w-36 rounded-md" />
      </div>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-4 space-y-2">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-7 w-16" />
          <SkeletonBlock className="h-2.5 w-32" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <SkeletonBlock className="h-5 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <SkeletonBlock className="h-5 w-40" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-2.5 py-2" role="status" aria-label="Loading records">
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0">
        <SkeletonBlock className="h-4 w-1/4" />
        <SkeletonBlock className="h-4 w-1/3" />
        <SkeletonBlock className="h-4 w-20" />
        <SkeletonBlock className="h-4 w-16 ml-auto" />
      </div>
    ))}
  </div>
);
