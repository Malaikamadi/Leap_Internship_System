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
      case 'ENROLLED':
      case 'CLAIMED':
        return {
          wrap: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
          dot: 'bg-emerald-600',
        };

      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'AWAITING_CONFIRMATION':
      case 'IN_PROGRESS':
      case 'UNCLAIMED':
        return {
          wrap: 'bg-blue-50 text-blue-800 border-blue-200/90',
          dot: 'bg-blue-600',
        };

      case 'CORRECTION_REQUIRED':
      case 'PENDING':
      case 'PENDING_EMAIL_CONFIRMATION':
      case 'ON_LEAVE':
        return {
          wrap: 'bg-amber-50 text-amber-800 border-amber-200/90',
          dot: 'bg-amber-600',
        };

      case 'REJECTED':
      case 'CANCELLED':
      case 'NOT_COMPLETED':
      case 'FAILED':
      case 'INCOMPLETE':
      case 'CLOSED':
      case 'SUSPENDED':
      case 'WITHDRAWN':
        return {
          wrap: 'bg-rose-50 text-rose-800 border-rose-200/90',
          dot: 'bg-rose-600',
        };

      case 'DRAFT':
      default:
        return {
          wrap: 'bg-slate-100 text-slate-700 border-slate-200/90',
          dot: 'bg-slate-500',
        };
    }
  };

  const styles = getStatusStyles(status);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border uppercase tracking-wide whitespace-nowrap',
        styles.wrap,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 mr-1.5 rounded-full shrink-0', styles.dot)} />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
