import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { api } from '../services/api.ts';
import { AnalyticsData, User as UserType, UserRole } from '../types.ts';
import {
  ShieldCheck,
  Users,
  Bell,
  Calendar,
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
  UserX,
  UserCheck,
  RefreshCw,
  Search,
  Building,
  GraduationCap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, uRes] = await Promise.all([
        api.analytics.get(),
        api.users.list(),
      ]);
      setAnalytics(sRes.analytics || null);
      setUsers(uRes.users || []);
    } catch (err: any) {
      showToast('Error loading analytics', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await api.users.updateRole(userId, newRole);
      showToast('Role Updated', `User permissions changed to ${newRole}.`, 'success');
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      showToast('Role update failed', err.message, 'error');
    }
  };

  const handleToggleStatus = async (userItem: UserType) => {
    try {
      const nextStatus = userItem.status === 'active' ? 'suspended' : 'active';
      const res = await api.users.updateStatus(userItem._id, nextStatus);
      showToast('Status Updated', res.message, 'info');
      setUsers((prev) =>
        prev.map((u) => (u._id === userItem._id ? res.user : u))
      );
    } catch (err: any) {
      showToast('Action failed', err.message, 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.collegeId.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Recharts complaint category data
  const complaintCategoryData = analytics?.complaintsByCategory
    ? analytics.complaintsByCategory.map((item) => ({ name: item.name, value: item.count }))
    : [];

  // Recharts complaint status data
  const complaintStatusData = analytics?.complaintsByStatus
    ? analytics.complaintsByStatus.map((item) => ({ name: item.name, value: item.count }))
    : [];

  const resolutionRate =
    analytics && (analytics.counts.pendingComplaints + analytics.counts.resolvedComplaints > 0)
      ? Math.round(
          (analytics.counts.resolvedComplaints /
            (analytics.counts.pendingComplaints + analytics.counts.resolvedComplaints)) *
            100
        )
      : 85;

  return (
    <div id="admin-analytics-page" className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Campus Administration & Operational Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time telemetry across academic affairs, grievance velocity, campus event engagement, and RBAC user provisioning.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Students</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{analytics?.counts.totalStudents ?? 0}</div>
          <span className="text-[10px] text-blue-600 font-medium">Enrolled & Active</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Faculty Members</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{analytics?.counts.totalFaculty ?? 0}</div>
          <span className="text-[10px] text-emerald-600 font-medium">Verified Staff</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Active Notices</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{analytics?.counts.totalNotices ?? 0}</div>
          <span className="text-[10px] text-slate-400 font-medium">Published Bulletins</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Campus Events</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{analytics?.counts.upcomingEvents ?? 0}</div>
          <span className="text-[10px] text-emerald-600 font-medium">{analytics?.counts.eventRegistrations ?? 0} Bookings</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Grievance Tickets</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {(analytics?.counts.pendingComplaints ?? 0) + (analytics?.counts.resolvedComplaints ?? 0)}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">
            {analytics?.counts.pendingComplaints ?? 0} In Queue
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Resolution Rate</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {resolutionRate}%
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Resolved / Closed</span>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Grievance Status Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Grievance Resolution Funnel</h3>
              <p className="text-xs text-slate-500">Breakdown of tickets across the 5 resolution stages</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complaintStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {complaintStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Complaints by Facility Category */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Complaints by Category</h3>
              <p className="text-xs text-slate-500">Distribution of facility faults and student concerns</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complaintCategoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {complaintCategoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* User Management and RBAC Control Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Campus User Directory & Access Control (RBAC)
            </h3>
            <p className="text-xs text-slate-500">
              Promote user roles, inspect academic affiliations, and suspend/activate campus accounts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3">Member Details</th>
                <th className="px-6 py-3">College ID</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isCurrent = u._id === user?._id;
                return (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.fullName}
                          className="w-8 h-8 rounded-full object-cover bg-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">
                            {u.fullName} {isCurrent && <span className="text-blue-600 font-normal">(You)</span>}
                          </p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3.5 font-mono text-slate-600 font-semibold">
                      {u.collegeId}
                    </td>

                    <td className="px-6 py-3.5 text-slate-600">
                      {u.department} {u.semester ? `(${u.semester})` : ''}
                    </td>

                    <td className="px-6 py-3.5">
                      <select
                        value={u.role}
                        disabled={isCurrent}
                        onChange={(e) => handleRoleChange(u._id, e.target.value as UserRole)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize outline-none cursor-pointer border ${
                          u.role === 'admin'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : u.role === 'faculty'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>

                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      {!isCurrent && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            u.status === 'active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
