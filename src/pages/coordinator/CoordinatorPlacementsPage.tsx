import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  InternshipApplicationRow,
  PlacementOpportunityRow,
  HostOrganizationRow,
  PlacementRow,
  AcademicSupervisorRow,
  SupervisorAssignmentRow,
  StudentProfileRow,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../lib/utils';
import {
  Building2,
  UserCheck,
  Play,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react';

export const CoordinatorPlacementsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<InternshipApplicationRow[]>([]);
  const [opportunities, setOpportunities] = useState<PlacementOpportunityRow[]>([]);
  const [organizations, setOrganizations] = useState<HostOrganizationRow[]>([]);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [supervisors, setSupervisors] = useState<AcademicSupervisorRow[]>([]);
  const [assignments, setAssignments] = useState<SupervisorAssignmentRow[]>([]);
  const [students, setStudents] = useState<StudentProfileRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  // Create placement form
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>('');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('');
  const [startDate, setStartDate] = useState('2026-12-01');
  const [endDate, setEndDate] = useState('2027-02-28');

  // Per-placement supervisor selection
  const [supervisorChoices, setSupervisorChoices] = useState<Record<string, string>>({});
  const [cancelReason, setCancelReason] = useState<Record<string, string>>({});

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPlacementData = useCallback(async () => {
    setLoading(true);
    const [
      { data: appRows },
      { data: oppRows },
      { data: orgRows },
      { data: plRows },
      { data: supRows },
      { data: saRows },
      { data: spRows },
      { data: profRows },
    ] = await Promise.all([
      supabase.from('internship_applications').select('*').eq('status', 'APPROVED'),
      supabase.from('placement_opportunities').select('*').eq('status', 'OPEN'),
      supabase.from('host_organizations').select('*'),
      supabase.from('placements').select('*').order('created_at', { ascending: false }),
      supabase.from('academic_supervisors').select('*'),
      supabase.from('supervisor_assignments').select('*').eq('is_current', true),
      supabase.from('student_profiles').select('*'),
      supabase.from('profiles').select('*'),
    ]);

    const apps = (appRows || []) as InternshipApplicationRow[];
    const opps = (oppRows || []) as PlacementOpportunityRow[];
    const pls = (plRows || []) as PlacementRow[];
    const sups = (supRows || []) as AcademicSupervisorRow[];
    const sas = (saRows || []) as SupervisorAssignmentRow[];

    setApplications(apps);
    setOpportunities(opps);
    setOrganizations((orgRows || []) as HostOrganizationRow[]);
    setPlacements(pls);
    setSupervisors(sups);
    setAssignments(sas);
    setStudents((spRows || []) as StudentProfileRow[]);
    setProfiles((profRows || []) as UserProfile[]);

    const unplacedApps = apps.filter(
      (a) =>
        !pls.some(
          (p) =>
            p.student_id === a.student_id &&
            ['PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'ACTIVE'].includes(p.status)
        )
    );

    if (unplacedApps.length > 0 && !selectedApplicationId) {
      setSelectedApplicationId(unplacedApps[0].id);
    }
    if (opps.length > 0 && !selectedOpportunityId) {
      setSelectedOpportunityId(opps[0].id);
    }

    const defaultSupChoices: Record<string, string> = {};
    for (const pl of pls) {
      const currentSa = sas.find((s) => s.placement_id === pl.id && s.is_current);
      defaultSupChoices[pl.id] = currentSa?.supervisor_id || sups[0]?.id || '';
    }
    setSupervisorChoices(defaultSupChoices);

    setLoading(false);
  }, [selectedApplicationId, selectedOpportunityId]);

  useEffect(() => {
    loadPlacementData();
  }, [loadPlacementData]);

  const spById = Object.fromEntries(students.map((s) => [s.id, s]));
  const profById = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const orgById = Object.fromEntries(organizations.map((o) => [o.id, o]));
  const oppById = Object.fromEntries(opportunities.map((o) => [o.id, o]));
  const supById = Object.fromEntries(supervisors.map((s) => [s.id, s]));

  const eligibleApprovedApps = applications.filter(
    (a) =>
      !placements.some(
        (p) =>
          p.student_id === a.student_id &&
          ['PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'ACTIVE'].includes(p.status)
      )
  );

  const handleCreatePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedApplicationId || !selectedOpportunityId) {
      setError('Select both an approved student application and an open placement opportunity.');
      return;
    }

    setProcessing(true);
    const { error: rpcErr } = await supabase.rpc('coordinator_create_placement', {
      p_application_id: selectedApplicationId,
      p_opportunity_id: selectedOpportunityId,
      p_start_date: startDate,
      p_end_date: endDate,
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    setSelectedApplicationId('');
    await loadPlacementData();
    setSuccess('Placement created and notifications dispatched.');
  };

  const handleAssignSupervisor = async (placementId: string) => {
    setError(null);
    setSuccess(null);
    const supervisorId = supervisorChoices[placementId];
    if (!supervisorId) {
      setError('Select an academic supervisor first.');
      return;
    }

    setProcessing(true);
    const { error: rpcErr } = await supabase.rpc('coordinator_assign_supervisor', {
      p_placement_id: placementId,
      p_supervisor_id: supervisorId,
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await loadPlacementData();
    setSuccess('Academic supervisor assigned to placement.');
  };

  const handleActivatePlacement = async (placementId: string) => {
    setError(null);
    setSuccess(null);
    setProcessing(true);

    const { error: rpcErr } = await supabase.rpc('coordinator_activate_placement', {
      p_placement_id: placementId,
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await loadPlacementData();
    setSuccess('Placement activated. Progress reporting and completion tracking are now open.');
  };

  const handleCancelPlacement = async (placementId: string) => {
    setError(null);
    setSuccess(null);
    const reason = (cancelReason[placementId] || '').trim();
    if (reason.length < 5) {
      setError('Enter a cancellation reason (at least 5 characters) before cancelling.');
      return;
    }

    setProcessing(true);
    const { error: rpcErr } = await supabase.rpc('coordinator_cancel_placement', {
      p_placement_id: placementId,
      p_reason: reason,
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await loadPlacementData();
    setSuccess('Placement cancelled.');
  };

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-[#002B49]">
          Placement Matching & Supervisor Assignment
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Match approved students to host opportunities, allocate academic supervisors, and activate
          confirmed internships
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-start gap-2.5"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Assign New Placement Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-teal-600" />
            <span>
              Assign Placement ({eligibleApprovedApps.length} approved students awaiting placement)
            </span>
          </CardTitle>
        </CardHeader>

        {eligibleApprovedApps.length === 0 ? (
          <p className="text-xs text-slate-500">
            All currently approved students have already been assigned a placement. Approve a
            student application first to assign a new placement.
          </p>
        ) : (
          <form onSubmit={handleCreatePlacement} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs items-end">
            <div>
              <label htmlFor="pl-app" className="block font-semibold text-slate-700">
                Approved Student Application *
              </label>
              <select
                id="pl-app"
                required
                value={selectedApplicationId}
                onChange={(e) => setSelectedApplicationId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              >
                <option value="">Select approved student...</option>
                {eligibleApprovedApps.map((app) => {
                  const sp = spById[app.student_id];
                  const up = sp ? profById[sp.user_id] : undefined;
                  return (
                    <option key={app.id} value={app.id}>
                      {up?.full_name || 'Student'} ({sp?.student_number}) — {app.academic_year}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label htmlFor="pl-opp" className="block font-semibold text-slate-700">
                Placement Opportunity *
              </label>
              <select
                id="pl-opp"
                required
                value={selectedOpportunityId}
                onChange={(e) => setSelectedOpportunityId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              >
                <option value="">Select opportunity...</option>
                {opportunities.map((opp) => {
                  const org = orgById[opp.organization_id];
                  const filled = placements.filter(
                    (p) => p.opportunity_id === opp.id && p.status !== 'CANCELLED'
                  ).length;
                  return (
                    <option key={opp.id} value={opp.id}>
                      {org?.name} — {opp.title} ({filled}/{opp.capacity} filled)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="pl-start" className="block font-semibold text-slate-700">
                  Start Date *
                </label>
                <input
                  id="pl-start"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-2.5 py-2 text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="pl-end" className="block font-semibold text-slate-700">
                  End Date *
                </label>
                <input
                  id="pl-end"
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-2.5 py-2 text-slate-900"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={processing}
              >
                Assign Placement
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Placements List & Supervisor Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-600" />
            <span>Placements & Academic Supervisor Allocation ({placements.length})</span>
          </CardTitle>
        </CardHeader>

        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Loading placements...</p>
        ) : placements.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">No placements created yet.</p>
        ) : (
          <div className="space-y-4">
            {placements.map((pl) => {
              const sp = spById[pl.student_id];
              const studentUser = sp ? profById[sp.user_id] : undefined;
              const org = orgById[pl.organization_id];
              const opp = oppById[pl.opportunity_id];
              const currentSa = assignments.find(
                (s) => s.placement_id === pl.id && s.is_current
              );
              const assignedSup = currentSa ? supById[currentSa.supervisor_id] : undefined;
              const assignedSupUser = assignedSup ? profById[assignedSup.user_id] : undefined;
              const isLive = [
                'PENDING',
                'AWAITING_CONFIRMATION',
                'CONFIRMED',
                'ACTIVE',
              ].includes(pl.status);

              return (
                <div
                  key={pl.id}
                  className="rounded-xl border border-slate-200 p-4 space-y-3 text-xs bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-sm font-bold text-slate-900">
                        {studentUser?.full_name || 'Student'}
                      </span>{' '}
                      <span className="text-slate-500">({sp?.student_number})</span>
                      <p className="text-teal-700 font-medium mt-0.5">
                        {org?.name} — {opp?.title || 'Internship Placement'} (
                        {formatDate(pl.start_date)} to {formatDate(pl.end_date)})
                      </p>
                    </div>
                    <StatusBadge status={pl.status} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    {/* Supervisor Allocation */}
                    <div>
                      <label className="block font-semibold text-slate-700">
                        Academic Supervisor (Current:{' '}
                        {assignedSupUser?.full_name || 'Unassigned'})
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <select
                          aria-label={`Supervisor for ${studentUser?.full_name || pl.id}`}
                          disabled={!isLive}
                          value={supervisorChoices[pl.id] || ''}
                          onChange={(e) =>
                            setSupervisorChoices({
                              ...supervisorChoices,
                              [pl.id]: e.target.value,
                            })
                          }
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 disabled:bg-slate-100"
                        >
                          {supervisors.map((sup) => {
                            const supProf = profById[sup.user_id];
                            return (
                              <option key={sup.id} value={sup.id}>
                                {sup.title ? `${sup.title} ` : ''}
                                {supProf?.full_name} ({sup.department})
                              </option>
                            );
                          })}
                        </select>
                        {isLive && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            isLoading={processing}
                            onClick={() => handleAssignSupervisor(pl.id)}
                          >
                            <UserCheck className="mr-1 h-3.5 w-3.5" />
                            Assign
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Host Response & Activation */}
                    <div>
                      <span className="block font-semibold text-slate-700">
                        Host Confirmation & Activation
                      </span>
                      <p className="text-slate-600 mt-1">
                        {pl.host_response_note || 'Awaiting host confirmation'}
                      </p>
                      {pl.status === 'CONFIRMED' && (
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            isLoading={processing}
                            onClick={() => handleActivatePlacement(pl.id)}
                          >
                            <Play className="mr-1.5 h-3.5 w-3.5" />
                            Activate Placement
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Cancellation */}
                    {isLive && (
                      <div>
                        <label className="block font-semibold text-slate-700">
                          Cancel Placement (Reason required)
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Cancellation reason..."
                            value={cancelReason[pl.id] || ''}
                            onChange={(e) =>
                              setCancelReason({ ...cancelReason, [pl.id]: e.target.value })
                            }
                            className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900"
                          />
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            isLoading={processing}
                            onClick={() => handleCancelPlacement(pl.id)}
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

