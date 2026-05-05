/**
 * AdminDashboard – Main dashboard component for users with administrator privileges.
 *
 * Displays:
 *   - Summary cards (total users, logs, active sessions)
 *   - A bar chart of log activity over the last 7 days
 *   - A table of all users with search, edit, and delete actions
 *   - A modal for creating new users
 *   - System logs (paginated, scrollable)
 *
 * All API calls use the fetchWithCsrf helper to automatically include CSRF tokens.
 * Admin authorization is enforced on the backend; this component does not rely solely on frontend checks.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { CyberCard } from '../components/CyberCard';
import { CyberModal } from '../components/CyberModal';
import { GridBackground } from '../components/GridBackground';
import { fetchWithCsrf } from '../../utils/csrf';
import {
  Users,
  Activity,
  Shield,
  Monitor,
  Search,
  Edit,
  Trash2,
  Plus,
  UserPlus,
  Database,
  Key
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Type definitions for the data structures returned by the backend API
interface User {
  id: number;
  username: string;
  email: string;
  role: string; // 'Admin', 'Moderator', or 'User'
}

interface Log {
  timestamp: string;
  action: string;
  user: string;
  ip: string;
}

interface Stats {
  total_users: number;
  total_logs: number;
  active_sessions: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // ------------------------------------------------------------------
  // State declarations
  // ------------------------------------------------------------------
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    total_logs: 0,
    active_sessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', role: 'User', password: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [chartData, setChartData] = useState<{ day: string; logs: number }[]>([]);

  // ------------------------------------------------------------------
  // Data fetching on component mount
  // ------------------------------------------------------------------
  useEffect(() => {
    // Fetch admin data in parallel for better performance
    Promise.all([
      fetchWithCsrf('/api/admin/users').then(res => res.json()),
      fetchWithCsrf('/api/admin/logs').then(res => res.json()),
      fetchWithCsrf('/api/admin/stats').then(res => res.json())
    ])
      .then(([usersData, logsResponse, statsData]) => {
        setUsers(usersData);

        // Extract logs array (backend returns paginated response with `logs` field)
        const logsArray = logsResponse.logs || logsResponse;
        setLogs(logsArray);
        setStats(statsData);

        // Aggregate logs by day for the bar chart
        const logCountByDay: Record<string, number> = {};
        logsArray.forEach((log: Log) => {
          const day = log.timestamp.split(' ')[0]; // Extract YYYY-MM-DD
          logCountByDay[day] = (logCountByDay[day] || 0) + 1;
        });
        const chart = Object.entries(logCountByDay)
          .map(([day, count]) => ({ day, logs: count }))
          .sort((a, b) => a.day.localeCompare(b.day))
          .slice(-7); // Keep only the last 7 days
        setChartData(chart);
      })
      .catch(err => {
        console.error('Failed to fetch admin data:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // Empty dependency array → runs only once after initial render

  // ------------------------------------------------------------------
  // Event handlers
  // ------------------------------------------------------------------
  const handleLogout = async () => {
    await fetchWithCsrf('/api/auth/logout', { method: 'POST' });
    navigate('/');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetchWithCsrf('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        // Refresh the user list
        const updatedUsers = await fetchWithCsrf('/api/admin/users').then(r => r.json());
        setUsers(updatedUsers);
        setIsCreateUserModalOpen(false);
        setNewUser({ username: '', email: '', role: 'User', password: '' });
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create user');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Delete this user?')) return;
    try {
      const res = await fetchWithCsrf(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        // Remove the user from local state
        setUsers(users.filter(u => u.id !== userId));
      } else {
        const err = await res.json();
        alert(err.error || 'Delete failed');
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  // Placeholder for edit functionality – could be extended with a modal
  const handleEditUser = (user: User) => {
    alert(`Edit user ${user.username} – implement modal`);
  };

  // Filter users based on search term (username or email)
  const filteredUsers = users.filter(
    user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Data for summary cards (derived from stats)
  const summaryCards = [
    { title: 'TOTAL_USERS', value: stats.total_users, icon: Users },
    { title: 'TOTAL_LOGS', value: stats.total_logs, icon: Database },
    { title: 'ACTIVE_SESSIONS', value: stats.active_sessions, icon: Activity }
  ];

  // ------------------------------------------------------------------
  // Loading state rendering
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <GridBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-[#00FFFF] text-2xl">LOADING...</div>
        </div>
      </GridBackground>
    );
  }

  return (
    <GridBackground>
      {/* Top Bar */}
      <div className="bg-black border-b-2 border-[#00FFFF] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#00FFFF] uppercase tracking-wider">
                &gt; ADMIN_CONTROL_PANEL
              </h1>
              <span 
                className="px-3 py-1 bg-[#00FFFF] text-black text-xs font-bold uppercase"
                style={{ boxShadow: '0 0 15px rgba(0, 255, 255, 0.8)' }}
              >
                ADMIN
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00FFFF] flex items-center justify-center" style={{ boxShadow: '0 0 15px rgba(0, 255, 255, 0.8)' }}>
                  <Shield className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white mono">ADMIN_USER</p>
                  <p className="text-xs text-[#00FFFF] mono">0xADMIN01</p>
                </div>
              </div>
              <motion.button
                onClick={handleLogout}
                className="px-4 py-2 bg-black text-[#00FFFF] border border-[#00FFFF] text-sm font-bold uppercase hover:bg-[#00FFFF] hover:text-black transition-all flex items-center gap-2"
                whileHover={{ boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }}
                whileTap={{ scale: 0.95 }}
              >
                <Monitor className="w-4 h-4" />
                LOGOUT
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {summaryCards.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CyberCard glow className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#00FFFF] mb-2 uppercase tracking-wider mono">{item.title}</p>
                    <p className="text-4xl font-bold text-white mono">{item.value}</p>
                  </div>
                  <div className="w-16 h-16 border-2 border-[#00FFFF] bg-[#00FFFF]/10 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                    <item.icon className="w-8 h-8 text-[#00FFFF]" />
                  </div>
                </div>
              </CyberCard>
            </motion.div>
          ))}
        </div>

        {/* Analytics Chart */}
        <CyberCard glow className="p-6 mb-8">
          <h2 className="text-xl font-bold text-[#00FFFF] mb-6 uppercase tracking-wider mono">
            &gt; LOG_ACTIVITY_[7D]
          </h2>
          {chartData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-white/50">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 255, 0.2)" />
                <XAxis 
                  dataKey="day" 
                  stroke="#00FFFF"
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#00FFFF"
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#000000',
                    border: '1px solid #00FFFF',
                    fontFamily: 'monospace'
                  }}
                  labelStyle={{ color: '#00FFFF' }}
                  itemStyle={{ color: '#FFFFFF' }}
                />
                <Bar dataKey="logs" fill="#00FFFF" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CyberCard>

        {/* Users Table */}
        <CyberCard glow className="p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#00FFFF]/30">
            <h2 className="text-xl font-bold text-[#00FFFF] uppercase tracking-wider mono">
              &gt; USER_MANAGEMENT
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00FFFF]" />
                <input
                  type="text"
                  placeholder="SEARCH_USERS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)] mono text-sm uppercase"
                />
              </div>
              {/* Create User Button */}
              <motion.button
                onClick={() => setIsCreateUserModalOpen(true)}
                className="px-4 py-2 bg-black text-[#00FFFF] border border-[#00FFFF] text-sm font-bold uppercase hover:bg-[#00FFFF] hover:text-black transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                whileHover={{ boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }}
                whileTap={{ scale: 0.95 }}
              >
                <UserPlus className="w-4 h-4" />
                CREATE
              </motion.button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-white/50">No users found</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#00FFFF]/30">
                    <th className="text-left py-3 px-4 text-xs font-bold text-[#00FFFF] uppercase tracking-wider mono">ID</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-[#00FFFF] uppercase tracking-wider mono">USERNAME</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-[#00FFFF] uppercase tracking-wider mono">EMAIL</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-[#00FFFF] uppercase tracking-wider mono">ROLE</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-[#00FFFF] uppercase tracking-wider mono">ACTIONS</th>
                   </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-[#00FFFF]/10 hover:bg-[#00FFFF]/5 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-white mono">{user.id}</td>
                      <td className="py-3 px-4 text-sm font-bold text-white mono">{user.username}</td>
                      <td className="py-3 px-4 text-sm text-white/70">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 text-xs font-bold uppercase mono ${
                          user.role === 'Admin' 
                            ? 'bg-[#00FFFF] text-black' 
                            : user.role === 'Moderator'
                            ? 'border border-[#00FFFF] text-[#00FFFF]'
                            : 'border border-white/30 text-white'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => handleEditUser(user)}
                            className="p-2 border border-[#00FFFF]/50 hover:bg-[#00FFFF]/10 hover:border-[#00FFFF] transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Edit className="w-4 h-4 text-[#00FFFF]" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 border border-white/30 hover:bg-red-500/10 hover:border-red-500 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-4 h-4 text-white hover:text-red-500" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CyberCard>

        {/* System Logs */}
        <CyberCard glow className="p-6">
          <h2 className="text-xl font-bold text-[#00FFFF] mb-6 pb-4 border-b border-[#00FFFF]/30 uppercase tracking-wider mono flex items-center gap-2">
            <Activity className="w-5 h-5" />
            &gt; SYSTEM_LOGS
          </h2>
          <div className="bg-black border border-[#00FFFF]/30 p-4 max-h-[300px] overflow-y-auto mono text-xs space-y-1">
            {logs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-wrap gap-2 py-1 hover:bg-[#00FFFF]/5 px-2 transition-colors"
              >
                <span className="text-[#00FFFF]">[{log.timestamp}]</span>
                <span className={`font-bold ${
                  log.action.includes('FAILED') ? 'text-red-500' : 
                  log.action.includes('DELETE') ? 'text-orange-500' : 
                  log.action.includes('LOGIN') ? 'text-green-500' : 
                  'text-white'
                }`}>
                  {log.action}
                </span>
                <span className="text-white/70">user={log.user}</span>
                <span className="text-[#00FFFF]/70">ip={log.ip}</span>
              </motion.div>
            ))}
          </div>
        </CyberCard>
      </div>

      {/* Create User Modal */}
      <CyberModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        title="&gt; CREATE_NEW_USER"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs text-[#00FFFF] mb-2 uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="w-full px-4 py-2 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)] mono"
              placeholder="john_doe"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#00FFFF] mb-2 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full px-4 py-2 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)]"
              placeholder="john@system.net"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#00FFFF] mb-2 uppercase tracking-wider">Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full px-4 py-2 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)] mono"
            >
              <option value="User" className="bg-black">USER</option>
              <option value="Moderator" className="bg-black">MODERATOR</option>
              <option value="Admin" className="bg-black">ADMIN</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#00FFFF] mb-2 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full px-4 py-2 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)] mono"
              placeholder="••••••••"
              required
            />
          </div>

          {/* CSRF Token (visual only; actual token is in header) */}
          <div className="flex items-center gap-2 px-3 py-2 border border-[#00FFFF]/30 bg-[#00FFFF]/5">
            <Key className="w-4 h-4 text-[#00FFFF]" />
            <input type="hidden" name="csrf_token" value="0xCREATE_USER_ABC123" />
            <span className="text-xs text-[#00FFFF] mono">CSRF: 0xCREATE_USER_ABC123</span>
          </div>

          <div className="flex gap-3 pt-2">
            <motion.button
              type="submit"
              disabled={isCreating}
              className="flex-1 py-2 px-4 bg-black text-[#00FFFF] border-2 border-[#00FFFF] font-bold uppercase hover:bg-[#00FFFF] hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }}
              whileTap={{ scale: 0.98 }}
            >
              {isCreating ? 'CREATING...' : (
                <>
                  <Plus className="w-4 h-4" />
                  CREATE
                </>
              )}
            </motion.button>
            <button
              type="button"
              onClick={() => setIsCreateUserModalOpen(false)}
              className="px-4 py-2 bg-black text-white border border-white/50 hover:border-[#00FFFF] hover:text-[#00FFFF] uppercase transition-all"
            >
              CANCEL
            </button>
          </div>
        </form>
      </CyberModal>
    </GridBackground>
  );
};

export default AdminDashboard;