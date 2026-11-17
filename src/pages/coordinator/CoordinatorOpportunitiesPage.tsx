import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  HostOrganizationRow,
  PlacementOpportunityRow,
  PlacementRow,
} from '../../types/database';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Building2, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

export const CoordinatorOpportunitiesPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<HostOrganizationRow[]>([]);
  const [opportunities, setOpportunities] = useState<PlacementOpportunityRow[]>([]);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);

  // New organization form
  const [orgName, setOrgName] = useState('');
  const [orgIndustry, setOrgIndustry] = useState('');
  const [orgCity, setOrgCity] = useState('Freetown');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');

  // New opportunity form
  const [oppOrgId, setOppOrgId] = useState('');
  const [oppTitle, setOppTitle] = useState('');
  const [oppDepartment, setOppDepartment] = useState('');
  const [oppDescription, setOppDescription] = useState('');
  const [oppRequirements, setOppRequirements] = useState('');
  const [oppCapacity, setOppCapacity] = useState<number>(2);
  const [oppStartDate, setOppStartDate] = useState('2026-12-01');
  const [oppEndDate, setOppEndDate] = useState('2027-02-28');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: orgRows }, { data: oppRows }, { data: plRows }] = await Promise.all([
      supabase.from('host_organizations').select('*').order('name', { ascending: true }),
      supabase
        .from('placement_opportunities')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase.from('placements').select('*'),
    ]);

    const orgList = (orgRows || []) as HostOrganizationRow[];
    setOrganizations(orgList);
    setOpportunities((oppRows || []) as PlacementOpportunityRow[]);
    setPlacements((plRows || []) as PlacementRow[]);

    if (orgList.length > 0 && !oppOrgId) {
      setOppOrgId(orgList[0].id);
    }
    setLoading(false);
  }, [oppOrgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const { error: insErr } = await supabase.from('host_organizations').insert({
      name: orgName.trim(),
      industry: orgIndustry.trim(),
      city: orgCity.trim() || 'Freetown',
      address: orgAddress.trim() || null,
      contact_email: orgEmail.trim() || null,
      contact_phone: orgPhone.trim() || null,
      is_active: true,
    });

    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }

    setOrgName('');
    setOrgIndustry('');
    setOrgAddress('');
    setOrgEmail('');
    setOrgPhone('');
    await loadData();
    setSuccess('Host organization saved to PostgreSQL.');
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const { error: insErr } = await supabase.from('placement_opportunities').insert({
      organization_id: oppOrgId,
      title: oppTitle.trim(),
      department: oppDepartment.trim() || null,
      description: oppDescription.trim(),
      requirements: oppRequirements.trim() || null,
      capacity: Number(oppCapacity),
      start_date: oppStartDate || null,
      end_date: oppEndDate || null,
      status: 'OPEN',
      created_by: user?.id || null,
    });

    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }

    setOppTitle('');
    setOppDepartment('');
    setOppDescription('');
    setOppRequirements('');
    await loadData();
    setSuccess('Placement opportunity created in PostgreSQL.');
  };

  const handleToggleOpportunityStatus = async (opp: PlacementOpportunityRow) => {
    setError(null);
    setSuccess(null);
    const nextStatus = opp.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    const { error: updErr } = await supabase
      .from('placement_opportunities')
      .update({ status: nextStatus })
      .eq('id', opp.id);

    if (updErr) {
      setError(updErr.message);
      return;
    }
    await loadData();
    setSuccess(`Opportunity "${opp.title}" marked ${nextStatus}.`);
  };

  const orgById = Object.fromEntries(organizations.map((o) => [o.id, o]));

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-[#002B49]">
          Host Organizations & Placement Opportunities
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Register partner organizations and manage available internship placement slots
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

      {/* Forms: Add Organization & Add Opportunity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal-600" />
              <span>Register Host Organization</span>
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleCreateOrganization} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="org-name" className="block font-semibold text-slate-700">
                  Organization Name *
                </label>
                <input
                  id="org-name"
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Rokel Commercial Bank"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="org-ind" className="block font-semibold text-slate-700">
                  Industry *
                </label>
                <input
                  id="org-ind"
                  type="text"
                  required
                  value={orgIndustry}
                  onChange={(e) => setOrgIndustry(e.target.value)}
                  placeholder="e.g. Banking & Information Systems"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="org-city" className="block font-semibold text-slate-700">
                  City *
                </label>
                <input
                  id="org-city"
                  type="text"
                  required
                  value={orgCity}
                  onChange={(e) => setOrgCity(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="org-address" className="block font-semibold text-slate-700">
                  Physical Address
                </label>
                <input
                  id="org-address"
                  type="text"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  placeholder="Street address"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="org-email" className="block font-semibold text-slate-700">
                  Contact Email
                </label>
                <input
                  id="org-email"
                  type="email"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  placeholder="hr@company.sl"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="org-phone" className="block font-semibold text-slate-700">
                  Contact Phone
                </label>
                <input
                  id="org-phone"
                  type="text"
                  value={orgPhone}
                  onChange={(e) => setOrgPhone(e.target.value)}
                  placeholder="+232 76 000000"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Host Organization
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-teal-600" />
              <span>Create Placement Opportunity</span>
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleCreateOpportunity} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="opp-org" className="block font-semibold text-slate-700">
                  Host Organization *
                </label>
                <select
                  id="opp-org"
                  required
                  value={oppOrgId}
                  onChange={(e) => setOppOrgId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                >
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="opp-title" className="block font-semibold text-slate-700">
                  Opportunity Title *
                </label>
                <input
                  id="opp-title"
                  type="text"
                  required
                  value={oppTitle}
                  onChange={(e) => setOppTitle(e.target.value)}
                  placeholder="e.g. Full-Stack Software Intern"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="opp-dept" className="block font-semibold text-slate-700">
                  Department
                </label>
                <input
                  id="opp-dept"
                  type="text"
                  value={oppDepartment}
                  onChange={(e) => setOppDepartment(e.target.value)}
                  placeholder="IT Division"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="opp-cap" className="block font-semibold text-slate-700">
                  Capacity (Slots) *
                </label>
                <input
                  id="opp-cap"
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={oppCapacity}
                  onChange={(e) => setOppCapacity(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="opp-start" className="block font-semibold text-slate-700">
                  Start Date
                </label>
                <input
                  id="opp-start"
                  type="date"
                  value={oppStartDate}
                  onChange={(e) => setOppStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="opp-end" className="block font-semibold text-slate-700">
                  End Date
                </label>
                <input
                  id="opp-end"
                  type="date"
                  value={oppEndDate}
                  onChange={(e) => setOppEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="opp-desc" className="block font-semibold text-slate-700">
                Description (min 10 chars) *
              </label>
              <textarea
                id="opp-desc"
                rows={2}
                required
                value={oppDescription}
                onChange={(e) => setOppDescription(e.target.value)}
                placeholder="Responsibilities and learning environment..."
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="opp-req" className="block font-semibold text-slate-700">
                Candidate Requirements
              </label>
              <input
                id="opp-req"
                type="text"
                value={oppRequirements}
                onChange={(e) => setOppRequirements(e.target.value)}
                placeholder="Skills or coursework prerequisites"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>

            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create Opportunity
            </Button>
          </form>
        </Card>
      </div>

      {/* Existing Opportunities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Placement Opportunities ({opportunities.length})
          </CardTitle>
        </CardHeader>

        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Loading opportunities...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Title & Department</th>
                  <th className="px-3 py-2.5">Host Organization</th>
                  <th className="px-3 py-2.5">Filled / Capacity</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opportunities.map((opp) => {
                  const org = orgById[opp.organization_id];
                  const filled = placements.filter(
                    (p) => p.opportunity_id === opp.id && p.status !== 'CANCELLED'
                  ).length;
                  return (
                    <tr key={opp.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <p className="font-bold text-slate-900">{opp.title}</p>
                        <p className="text-[11px] text-slate-500">{opp.department || 'General'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-800">{org?.name}</p>
                        <p className="text-[11px] text-slate-500">{org?.industry}</p>
                      </td>
                      <td className="px-3 py-3 font-bold">
                        {filled} / {opp.capacity}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={opp.status} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleOpportunityStatus(opp)}
                        >
                          {opp.status === 'OPEN' ? 'Close' : 'Reopen'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
