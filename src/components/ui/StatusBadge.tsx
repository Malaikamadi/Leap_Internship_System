import React from 'react';
import {
  ApplicationStatus,
  PlacementStatus,
  ReportStatus,
  CompletionStatus,
  AssessmentStatus,
} from '../../types/database';
import { cn } from '../../lib/utils';

type AnyStatus =
  | ApplicationStatus
  | PlacementStatus
  | ReportStatus
  | CompletionStatus
  | AssessmentStatus
  | string;

interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusStyles = (st: string) => {
    switch (st) {
      case 'APPROVED':
      case 'ACTIVE':
      case 'ACCEPTED':
      case 'CONFIRMED':
      case 'COMPLETED':
      case 'FINALIZED':
      case 'OPEN':
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'AWAITING_CONFIRMATION':
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200';

      case 'CORRECTION_REQUIRED':
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'REJECTED':
      case 'CANCELLED':
      case 'NOT_COMPLETED':
      case 'FAILED':
      case 'INCOMPLETE':
      case 'CLOSED':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      case 'DRAFT':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider',
        getStatusStyles(status),
        className
      )}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70" />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
