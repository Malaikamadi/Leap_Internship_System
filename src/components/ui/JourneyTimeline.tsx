import React from 'react';
import { Check, AlertCircle, Clock } from 'lucide-react';
import {
  InternshipApplicationRow,
  PlacementRow,
  CompletionRecordRow,
} from '../../types/database';
import { cn } from '../../lib/utils';

interface JourneyTimelineProps {
  application: InternshipApplicationRow | null;
  placement: PlacementRow | null;
  acceptedReportsCount: number;
  completion: CompletionRecordRow | null;
}

type StageState = 'completed' | 'current' | 'attention' | 'upcoming';

interface StageItem {
  number: string;
  label: string;
  detail: string;
  state: StageState;
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  application,
  placement,
  acceptedReportsCount,
  completion,
}) => {
  const getStage1 = (): StageItem => {
    if (!application) {
      return {
        number: '01',
        label: 'Application',
        detail: 'Not started',
        state: 'current',
      };
    }
    if (application.status === 'APPROVED') {
      return {
        number: '01',
        label: 'Application',
        detail: 'Approved',
        state: 'completed',
      };
    }
    if (application.status === 'CORRECTION_REQUIRED' || application.status === 'REJECTED') {
      return {
        number: '01',
        label: 'Application',
        detail: application.status === 'REJECTED' ? 'Rejected' : 'Revision required',
        state: 'attention',
      };
    }
    return {
      number: '01',
      label: 'Application',
      detail: application.status.replace(/_/g, ' '),
      state: 'current',
    };
  };

  const getStage2 = (): StageItem => {
    if (!placement) {
      return {
        number: '02',
        label: 'Host Placement',
        detail: application?.status === 'APPROVED' ? 'Awaiting match' : 'Locked',
        state: application?.status === 'APPROVED' ? 'current' : 'upcoming',
      };
    }
    if (placement.status === 'ACTIVE' || placement.status === 'COMPLETED') {
      return {
        number: '02',
        label: 'Host Placement',
        detail: 'Confirmed & active',
        state: 'completed',
      };
    }
    if (placement.status === 'CANCELLED') {
      return {
        number: '02',
        label: 'Host Placement',
        detail: 'Cancelled',
        state: 'attention',
      };
    }
    return {
      number: '02',
      label: 'Host Placement',
      detail: placement.status.replace(/_/g, ' '),
      state: 'current',
    };
  };

  const getStage3 = (): StageItem => {
    if (!placement || (placement.status !== 'ACTIVE' && placement.status !== 'COMPLETED')) {
      return {
        number: '03',
        label: 'Progress Reports',
        detail: 'Pending activation',
        state: 'upcoming',
      };
    }
    if (placement.status === 'COMPLETED' || acceptedReportsCount >= 1) {
      return {
        number: '03',
        label: 'Progress Reports',
        detail: `${acceptedReportsCount} accepted`,
        state: placement.status === 'COMPLETED' ? 'completed' : 'current',
      };
    }
    return {
      number: '03',
      label: 'Progress Reports',
      detail: 'Logbook open',
      state: 'current',
    };
  };

  const getStage4 = (): StageItem => {
    if (completion?.host_evaluation_received && completion?.final_score !== null) {
      return {
        number: '04',
        label: 'Host & Academic Assessment',
        detail: `Score: ${completion.final_score}%`,
        state: 'completed',
      };
    }
    if (completion?.host_evaluation_received) {
      return {
        number: '04',
        label: 'Host & Academic Assessment',
        detail: 'Host eval received',
        state: 'current',
      };
    }
    if (placement?.status === 'ACTIVE') {
      return {
        number: '04',
        label: 'Host & Academic Assessment',
        detail: 'Awaiting evaluation',
        state: 'upcoming',
      };
    }
    return {
      number: '04',
      label: 'Host & Academic Assessment',
      detail: 'Upcoming',
      state: 'upcoming',
    };
  };

  const getStage5 = (): StageItem => {
    if (completion?.status === 'COMPLETED') {
      return {
        number: '05',
        label: 'Verified Completion',
        detail: 'Completed',
        state: 'completed',
      };
    }
    if (completion?.status === 'NOT_COMPLETED') {
      return {
        number: '05',
        label: 'Verified Completion',
        detail: 'Not completed',
        state: 'attention',
      };
    }
    return {
      number: '05',
      label: 'Verified Completion',
      detail: completion ? 'In progress' : 'Upcoming',
      state: 'upcoming',
    };
  };

  const stages = [getStage1(), getStage2(), getStage3(), getStage4(), getStage5()];

  return (
    <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-subtle">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
            LEAP Lifecycle Tracker
          </p>
          <h3 className="text-sm font-bold text-[#002B49]">
            Internship Progression Status
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          {stages.filter((s) => s.state === 'completed').length} / {stages.length} stages verified
        </span>
      </div>

      <ol className="mt-5 grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2 relative">
        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          return (
            <li key={stage.number} className="relative flex sm:flex-col items-start gap-3 sm:gap-2">
              {/* Connector rail on desktop */}
              {!isLast && (
                <div
                  className={cn(
                    'hidden sm:block absolute top-3.5 left-8 right-0 h-[2px]',
                    stage.state === 'completed' ? 'bg-teal-600' : 'bg-slate-200'
                  )}
                  aria-hidden="true"
                />
              )}

              <div
                className={cn(
                  'relative z-10 h-7 w-7 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 border transition-colors',
                  stage.state === 'completed' &&
                    'bg-teal-700 border-teal-700 text-white',
                  stage.state === 'current' &&
                    'bg-[#002B49] border-[#002B49] text-white ring-4 ring-[#002B49]/10',
                  stage.state === 'attention' &&
                    'bg-amber-50 border-amber-400 text-amber-800',
                  stage.state === 'upcoming' &&
                    'bg-slate-50 border-slate-200 text-slate-400'
                )}
              >
                {stage.state === 'completed' ? (
                  <Check className="h-3.5 w-3.5" />
                ) : stage.state === 'attention' ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : stage.state === 'current' ? (
                  <Clock className="h-3.5 w-3.5" />
                ) : (
                  stage.number
                )}
              </div>

              <div className="min-w-0">
                <p
                  className={cn(
                    'text-xs font-bold leading-snug',
                    stage.state === 'upcoming' ? 'text-slate-400' : 'text-slate-900'
                  )}
                >
                  {stage.label}
                </p>
                <p
                  className={cn(
                    'text-[11px] mt-0.5 capitalize',
                    stage.state === 'completed' && 'text-teal-700 font-medium',
                    stage.state === 'current' && 'text-[#002B49] font-semibold',
                    stage.state === 'attention' && 'text-amber-700 font-semibold',
                    stage.state === 'upcoming' && 'text-slate-400'
                  )}
                >
                  {stage.detail.toLowerCase()}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

