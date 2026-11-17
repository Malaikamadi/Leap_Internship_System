import React from 'react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  GraduationCap, 
  Building2, 
  Award, 
  TrendingUp, 
  Download 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const ManagementDashboard: React.FC = () => {

  const facultyData = [
    { faculty: 'ICT & Software', students: 48 },
    { faculty: 'Business & Finance', students: 35 },
    { faculty: 'Architecture & Design', students: 24 },
    { faculty: 'Mass Communication', students: 20 },
  ];

  const statusDistribution = [
    { name: 'Active Placed', value: 72, color: '#0d9488' },
    { name: 'In Review', value: 18, color: '#0ea5e9' },
    { name: 'Completed', value: 31, color: '#10b981' },
    { name: 'Awaiting Match', value: 6, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">University Executive Overview & Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Office of Academic Affairs • Limkokwing Sierra Leone
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" />
            Export Ministry Report (PDF)
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-[#002B49]">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Enrolled Interns</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-slate-900">127</span>
            <GraduationCap className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-[11px] text-teal-600 font-medium mt-1">↑ 14% vs previous academic year</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-teal-600">
          <p className="text-xs font-semibold text-teal-700 uppercase">Active Placements</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-teal-900">72</span>
            <Building2 className="h-6 w-6 text-teal-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Spread across 22 industry partners</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs font-semibold text-emerald-700 uppercase">Completion Rate</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-emerald-900">96.8%</span>
            <Award className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">On-track for graduation signoff</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-600">
          <p className="text-xs font-semibold text-blue-700 uppercase">Average GPA</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-blue-900">3.42</span>
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Strong academic performance</p>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">
              Internship Enrollment by Faculty
            </CardTitle>
          </CardHeader>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facultyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="faculty" tick={{ fontSize: 11 }} interval={0} angle={-10} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="students" fill="#002B49" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">
              Current Internship Pipeline Distribution
            </CardTitle>
          </CardHeader>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs mt-2">
            {statusDistribution.map((st) => (
              <div key={st.name} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: st.color }} />
                <span className="text-slate-600 font-medium">{st.name} ({st.value})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
