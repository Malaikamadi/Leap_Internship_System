import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  PlacementRow,
  StudentProfileRow,
  HostOrganizationRow,
  PlacementOpportunityRow,
  CompletionRecordRow,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../lib/utils';
import { Users, Search, Building2, Mail, Phone } from 'lucide-react';

export const SupervisorStudentsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [students, setStudents] = useState<StudentProfileRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [organizations, setOrganizations] = useState<HostOrganizationRow[]>([]);
  const [opportunities, setOpportunities] = useState<PlacementOpportunityRow[]>([]);
  const [completions, setCompletions] = useState<CompletionRecordRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAssignedStudents = useCallback(async () => {
    setLoading(true);
    const [
      { data: plRows },
      { data: spRows },
      { data: profRows },
      { data: orgRows },
      { data: oppRows },
      { data: compRows },
    ] = await Promise.all([
      supabase.from('placements').select('*').order('created_at', { ascending: false }),
      supabase.from('student_profiles').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('host_organizations').select('*'),
      supabase.from('placement_opportunities').select('*'),
      supabase.from('completion_records').select('*'),
    ]);

    setPlacements((plRows || []) as PlacementRow[]);
    setStudents((spRows || []) as StudentProfileRow[]);
    setProfiles((profRows || []) as UserProfile[]);
    setOrganizations((orgRows || []) as HostOrganizationRow[]);
    setOpportunities((oppRows || []) as PlacementOpportunityRow[]);
    setCompletions((compRows || []) as CompletionRecordRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAssignedStudents();
  }, [loadAssignedStudents]);

  const spById = Object.fromEntries(students.map((s) => [s.id, s]));
  const profById = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const orgById = Object.fromEntries(organizations.map((o) => [o.id, o]));
  const oppById = Object.fromEntries(opportunities.map((o) => [o.id, o]));
  const compByPlacement = Object.fromEntries(completions.map((c) => [c.placement_id, c]));

  const filtered = placements.filter((pl) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const sp = spById[pl.student_id];
    const up = sp ? profById[sp.user_id] : undefined;
    const org = orgById[pl.organization_id];
    return (
      (up?.full_name?.toLowerCase() || '').includes(q) ||
      (sp?.student_number?.toLowerCase() || '').includes(q) ||
      (org?.name?.toLowerCase() || '').includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-[#002B49]">Assigned Students & Placements</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          View students assigned to your academic supervision (Row Level Security scoped)
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search assigned students or host organizations..."
          className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600" />
            <span>Supervised Placements ({filtered.length})</span>
          </CardTitle>
        </CardHeader>

        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Loading assigned students...</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">
            No assigned students match your search.
          </p>
        ) : (
          <div className="space-y-4">
            {filtered.map((pl) => {
              const sp = spById[pl.student_id];
              const up = sp ? profById[sp.user_id] : undefined;
              const org = orgById[pl.organization_id];
              const opp = oppById[pl.opportunity_id];
              const comp = compByPlacement[pl.id];

              return (
                <div
                  key={pl.id}
                  className="rounded-xl border border-slate-200 p-4 space-y-3 text-xs bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-sm font-bold text-slate-900">
                        {up?.full_name || 'Student'}
                      </span>{' '}
                      <span className="text-slate-500">({sp?.student_number})</span>
                      <p className="text-slate-600 mt-0.5">
                        {sp?.programme} • Year {sp?.year_of_study} (GPA: {sp?.gpa ?? 'N/A'})
                      </p>
                    </div>
                    <StatusBadge status={pl.status} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <span className="text-slate-500 font-semibold">Host Placement</span>
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-teal-600" />
                        {org?.name}
                      </p>
                      <p className="text-slate-600">
                        {opp?.title} ({formatDate(pl.start_date)} to {formatDate(pl.end_date)})
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-500 font-semibold">Student Contact</span>
                      <p className="text-slate-800 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {up?.email}
                      </p>
                      {up?.phone && (
                        <p className="text-slate-600 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {up.phone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-500 font-semibold">Progress & Completion</span>
                      <p className="text-slate-800">
                        Accepted Reports: <strong>{comp?.accepted_reports ?? 0}</strong> (
                        {comp?.total_hours ?? 0} hrs)
                      </p>
                      <p className="text-slate-800">
                        Host Evaluation:{' '}
                        <strong>
                          {comp?.host_evaluation_received ? 'Received' : 'Pending'}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Link to="/app/supervisor/reports">
                      <Button variant="outline" size="sm">
                        Review Progress Reports
                      </Button>
                    </Link>
                    <Link to="/app/supervisor/assessments">
                      <Button variant="primary" size="sm">
                        Evaluations & Assessment
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

