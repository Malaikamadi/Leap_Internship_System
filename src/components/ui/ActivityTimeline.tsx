import React from 'react';
import { StatusBadge } from './StatusBadge';
import { formatDateTime } from '../../lib/utils';

export interface ActivityTimelineItem {
  id: string;
  status?: string;
  title?: string;
  body?: string | null;
  timestamp: string;
  meta?: string;
}

interface ActivityTimelineProps {
  items: ActivityTimelineItem[];
  emptyMessage?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  items,
  emptyMessage = 'No activity recorded yet.',
}) => {
  if (items.length === 0) {
    return <p className="py-6 text-center text-xs text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ol className="relative border-l border-slate-200 ml-2 space-y-4">
      {items.map((item) => (
        <li key={item.id} className="pl-4 relative">
          <span
            className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-white border-2 border-teal-600"
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {item.status && <StatusBadge status={item.status} />}
              {item.title && (
                <span className="text-xs font-semibold text-slate-900 truncate">
                  {item.title}
                </span>
              )}
            </div>
            <time className="text-[11px] font-mono text-slate-400 shrink-0">
              {formatDateTime(item.timestamp)}
            </time>
          </div>
          {item.body && (
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{item.body}</p>
          )}
          {item.meta && <p className="text-[11px] text-slate-400 mt-1">{item.meta}</p>}
        </li>
      ))}
    </ol>
  );
};
