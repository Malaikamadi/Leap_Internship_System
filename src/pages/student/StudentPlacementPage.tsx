import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  PlacementRow,
  HostOrganizationRow,
  PlacementOpportunityRow,
  AcademicSupervisorRow,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatDate, formatDateTime } from '../../lib/utils';
import { Building2, UserCheck, MapPin, Calendar, Mail, Phone } from 'lucide-react';

export const StudentPlacementPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [placement, setPlacement] = useState<PlacementRow | null>(null);
  const [organization, setOrganization] = useState<HostOrganizationRow | null>(null);
  const [opportunity, setOpportunity] = useState<PlacementOpportunityRow | null>(null);
  const [supervisor, setSupervisor] = useState<AcademicSupervisorRow | null>(null);
  const [supervisorProfile, setSupervisorProfile] = useState<UserProfile | null>(null);

  const loadPlacement = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: sp } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sp) {
      setLoading(false);
      return;
    }

    const { data: plRows } = await supabase
      .from('placements')
      .select('*')
      .eq('student_id', sp.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const pl = (plRows?.[0] as PlacementRow) || null;
    setPlacement(pl);

    if (pl) {
      const [{ data: orgData }, { data: oppData }, { data: saData }] = await Promise.all([
        supabase
          .from('host_organizations')
          .select('*')
          .eq('id', pl.organization_id)
          .maybeSingle(),
        supabase
          .from('placement_opportunities')
          .select('*')
          .eq('id', pl.opportunity_id)
          .maybeSingle(),
        supabase
          .from('supervisor_assignments')
          .select('*')
          .eq('placement_id', pl.id)
          .eq('is_current', true)
          .maybeSingle(),
      ]);

      setOrganization((orgData as HostOrganizationRow) || null);
      setOpportunity((oppData as PlacementOpportunityRow) || null);

      if (saData?.supervisor_id) {
        const { data: supData } = await supabase
          .from('academic_supervisors')
          .select('*')
          .eq('id', saData.supervisor_id)
          .maybeSingle();
        setSupervisor((supData as AcademicSupervisorRow) || null);

        if (supData?.user_id) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supData.user_id)
            .maybeSingle();
          setSupervisorProfile((profData as UserProfile) || null);
        }
      } else {
        setSupervisor(null);
        setSupervisorProfile(null);
      }
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadPlacement();
  }, [loadPlacement]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Loading placement details...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">My Internship Placement</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Host organization assignment, confirmation status, and academic supervisor details
          </p>
        </div>
        {placement && <StatusBadge status={placement.status} />}
      </div>

      {!placement ? (
        <Card className="p-8 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Placement Assigned Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Once your LEAP application is approved by the Coordinator, you will be matched to an
              available host organization opportunity.
            </p>
          </div>
          <div>
            <Link to="/app/student/application">
              <Button variant="primary" size="sm">
                Check Application Status
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-teal-600" />
                <span>{opportunity?.title || 'Internship Opportunity'}</span>
              </CardTitle>
              <StatusBadge status={placement.status} />
            </CardHeader>

            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2">
                <p className="text-sm font-bold text-slate-900">{organization?.name}</p>
                <p className="text-slate-600">
                  {organization?.industry} • {opportunity?.department || 'General Department'}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2 text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {organization?.address || opportunity?.location || organization?.city}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {formatDate(placement.start_date)} to {formatDate(placement.end_date)}
                  </span>
                </div>
              </div>

              {opportunity?.description && (
                <div>
                  <h4 className="font-bold text-slate-800">Role Description</h4>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    {opportunity.description}
                  </p>
                </div>
              )}

              {opportunity?.requirements && (
                <div>
                  <h4 className="font-bold text-slate-800">Workplace Requirements</h4>
                  <p className="text-slate-600 mt-1">{opportunity.requirements}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500">Host Confirmation Response:</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {placement.host_response_note || 'Pending host confirmation'}
                  </p>
                  {placement.host_responded_at && (
                    <p className="text-[11px] text-slate-400">
                      Responded: {formatDateTime(placement.host_responded_at)}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-slate-500">Host Organization Contact:</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {organization?.contact_email || 'N/A'}
                  </p>
                  <p className="text-slate-600">{organization?.contact_phone || ''}</p>
                </div>
              </div>

              {placement.cancellation_reason && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-700">
                  <strong>Cancellation Reason:</strong> {placement.cancellation_reason}
                </div>
              )}

              {placement.status === 'ACTIVE' && (
                <div className="pt-2">
                  <Link to="/app/student/reports">
                    <Button variant="primary" size="md">
                      Go to Progress Reports
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Assigned Academic Supervisor Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-teal-600" />
                <span>Academic Supervisor</span>
              </CardTitle>
            </CardHeader>

            {supervisor && supervisorProfile ? (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-1">
                  <p className="text-sm font-bold text-slate-900">
                    {supervisor.title ? `${supervisor.title} ` : ''}
                    {supervisorProfile.full_name}
                  </p>
                  <p className="text-teal-700 font-medium">{supervisor.department}</p>
                  <p className="text-slate-500">{supervisor.faculty}</p>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{supervisorProfile.email}</span>
                  </div>
                  {supervisorProfile.phone && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{supervisorProfile.phone}</span>
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500 pt-1">
                    Staff Number: {supervisor.staff_number}
                  </div>
                </div>
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-slate-500">
                An academic supervisor has not yet been assigned by the LEAP Coordinator.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

