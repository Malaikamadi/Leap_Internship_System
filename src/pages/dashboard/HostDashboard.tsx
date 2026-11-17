import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  HostRepresentativeRow,
  HostOrganizationRow,
  PlacementRow,
  HostEvaluationRow,
  StudentProfileRow,
  PlacementOpportunityRow,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../lib/utils';
import {
  Building2,
  Users,
  ClipboardCheck,
  Award,
  RefreshCw,
} from 'lucide-react';

export const HostDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [repRecord, setRepRecord] = useState<HostRepresentativeRow | null>(null);
  const [organization, setOrganization] = useState<HostOrganizationRow | null>(null);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [evaluations, setEvaluations] = useState<HostEvaluationRow[]>([]);
  const [students, setStudents] = useState<StudentProfileRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [opportunities, setOpportunities] = useState<PlacementOpportunityRow[]>([]);

  const loadHostDashboard = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: repData } = await supabase
      .from('host_representatives')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const rep = (repData as HostRepresentativeRow) || null;
    setRepRecord(rep);

    if (rep) {
      const [
        { data: orgData },
        { data: plRows },
        { data: evalRows },
        { data: spRows },
        { data: profRows },
        { data: oppRows },
      ] = await Promise.all([
        supabase
          .from('host_organizations')
          .select('*')
          .eq('id', rep.organization_id)
          .maybeSingle(),
        supabase.from('placements').select('*').order('created_at', { ascending: false }),
        supabase.from('host_evaluations').select('*'),
        supabase.from('student_profiles').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('placement_opportunities').select('*'),
      ]);

      setOrganization((orgData as HostOrganizationRow) || null);
      setPlacements((plRows || []) as PlacementRow[]);
      setEvaluations((evalRows || []) as HostEvaluationRow[]);
      setStudents((spRows || []) as StudentProfileRow[]);
      setProfiles((profRows || []) as UserProfile[]);
      setOpportunities((oppRows || []) as PlacementOpportunityRow[]);
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadHostDashboard();
  }, [loadHostDashboard]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Loading host organization portal from PostgreSQL...
      </div>
    );
  }

  const spById = Object.fromEntries(students.map((s) => [s.id, s]));
  const profById = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const oppById = Object.fromEntries(opportunities.map((o) => [o.id, o]));
  const evalPlacementIds = new Set(evaluations.map((e) => e.placement_id));

  const pendingConfirmations = placements.filter((p) => p.status === 'AWAITING_CONFIRMATION');
  const activeInterns = placements.filter(
    (p) => p.status === 'CONFIRMED' || p.status === 'ACTIVE'
  );
  const evaluationsAwaiting = placements.filter(
    (p) => p.status === 'ACTIVE' && !evalPlacementIds.has(p.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 uppercase mb-1">
            <Building2 className="h-3.5 w-3.5" />
            <span>Host Organization Portal</span>
          </div>
          <h2 className="text-xl font-bold text-[#002B49]">
            {organization?.name || 'Partner Organization'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Representative: {user?.full_name} ({repRecord?.job_title || 'Workplace Supervisor'}) •{' '}
            {organization?.address}, {organization?.city}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadHostDashboard}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Link to="/app/host/interns">
            <Button variant="primary" size="sm">
              Manage Confirmations ({pendingConfirmations.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-teal-600">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Assigned Interns</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{activeInterns.length}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <Users className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase">
              Pending Confirmations
            </p>
            <p className="text-2xl font-black text-amber-900 mt-1">
              {pendingConfirmations.length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <ClipboardCheck className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-indigo-600">
          <div>
            <p className="text-xs font-semibold text-indigo-700 uppercase">
              Evaluations Awaiting Submission
            </p>
            <p className="text-2xl font-black text-indigo-900 mt-1">
              {evaluationsAwaiting.length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Award className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Organization Placements List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Placements at {organization?.name} ({placements.length})
          </CardTitle>
        </CardHeader>

        {placements.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">
            No student placements are currently assigned to your organization.
          </p>
        ) : (
          <div className="space-y-3 text-xs">
            {placements.map((pl) => {
              const sp = spById[pl.student_id];
              const up = sp ? profById[sp.user_id] : undefined;
              const opp = oppById[pl.opportunity_id];
              const hasEval = evalPlacementIds.has(pl.id);

              return (
                <div
                  key={pl.id}
                  className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {up?.full_name || 'Student Intern'}
                      </span>
                      <span className="text-slate-400">({sp?.student_number})</span>
                      <StatusBadge status={pl.status} />
                    </div>
                    <p className="text-slate-600">
                      {sp?.programme} • Role: <strong>{opp?.title}</strong>
                    </p>
                    <p className="text-slate-500">
                      Period: {formatDate(pl.start_date)} to {formatDate(pl.end_date)} •
                      Evaluation: <strong>{hasEval ? 'Submitted' : 'Pending'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {pl.status === 'AWAITING_CONFIRMATION' && (
                      <Link to="/app/host/interns">
                        <Button variant="primary" size="sm">
                          Confirm Placement
                        </Button>
                      </Link>
                    )}
                    {pl.status === 'ACTIVE' && !hasEval && (
                      <Link to="/app/host/evaluations">
                        <Button variant="primary" size="sm">
                          Submit Evaluation
                        </Button>
                      </Link>
                    )}
                    <Link to="/app/host/interns">
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </Link>
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
