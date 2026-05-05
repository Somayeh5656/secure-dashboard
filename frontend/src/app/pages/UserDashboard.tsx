import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { CyberCard } from '../components/CyberCard';
import { CyberModal } from '../components/CyberModal';
import { GridBackground } from '../components/GridBackground';
import { fetchWithCsrf } from '../../utils/csrf';
import { 
  LayoutDashboard, 
  User, 
  Activity, 
  Settings, 
  Monitor,
  Edit2,
  MapPin,
  Clock,
  Key,
  Lock
} from 'lucide-react';

interface Profile {
  username: string;
  email: string;
  userId: string;
  joinDate: string;
  avatar: string;
}

interface ActivityItem {
  date: string;
  ip: string;
  action: string;
  location: string;
}

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- Data fetching ---
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchWithCsrf('/api/user/profile').then(res => res.json()),
      fetchWithCsrf('/api/user/activity').then(res => res.json())
    ]).then(([profileData, activityData]) => {
      setProfile(profileData);
      setActivity(activityData);
    }).catch(err => {
      console.error('Failed to fetch user data:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  // --- Handlers ---
  const handleLogout = async () => {
    await fetchWithCsrf('/api/auth/logout', { method: 'POST' });
    navigate('/');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      const res = await fetchWithCsrf('/api/user/change-password', {
        method: 'POST',
        body: JSON.stringify({
          old_password: currentPassword,
          new_password: newPassword,
        }),
      });
      if (res.ok) {
        alert('Password changed successfully');
        setIsPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await res.json();
        alert(err.error || 'Password change failed');
      }
    } catch (err) {
      console.error(err);
      alert('Password change failed');
    }
  };

  const handleProfileSave = async () => {
    // We'll use refs or local state for the edited values.
    // For simplicity, let's assume you have local editing states.
    // This is just an example – you'd need to actually collect the edited data.
    const updated = {
      username: (document.getElementById('edit-username') as HTMLInputElement)?.value,
      email: (document.getElementById('edit-email') as HTMLInputElement)?.value,
    };
    try {
      const res = await fetchWithCsrf('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const newProfile = await fetchWithCsrf('/api/user/profile').then(r => r.json());
        setProfile(newProfile);
        setIsEditingProfile(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      alert('Update failed');
    }
  };

  // Helper for avatar (if backend doesn't provide, generate)
  const avatarUrl = profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.username}&background=00FFFF&color=000000`;

  if (loading) {
    return (
      <GridBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-[#00FFFF] text-2xl">LOADING...</div>
        </div>
      </GridBackground>
    );
  }

  if (!profile) {
    return (
      <GridBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-500 text-2xl">Failed to load profile</div>
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
            <h1 className="text-xl font-bold text-[#00FFFF] uppercase tracking-wider">
              &gt; USER_DASHBOARD
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={avatarUrl}
                  alt={profile.username}
                  className="w-10 h-10 border-2 border-[#00FFFF]"
                  style={{ boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-white mono">{profile.username}</p>
                  <p className="text-xs text-[#00FFFF] mono">{profile.userId}</p>
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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <CyberCard glow className="p-4 sticky top-24">
              <nav className="space-y-2">
                {[
                  { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
                  { id: 'profile', label: 'PROFILE', icon: User },
                  { id: 'activity', label: 'ACTIVITY', icon: Activity },
                  { id: 'settings', label: 'SETTINGS', icon: Settings },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-all uppercase tracking-wider ${
                      activeSection === item.id
                        ? 'bg-[#00FFFF] text-black font-bold'
                        : 'text-white hover:bg-[#00FFFF]/10 border border-transparent hover:border-[#00FFFF]/30'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </nav>
            </CyberCard>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Profile Card */}
            <CyberCard glow className="p-6">
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-[#00FFFF]/30">
                <h2 className="text-2xl font-bold text-[#00FFFF] uppercase tracking-wider">&gt; PROFILE</h2>
                <motion.button
                  onClick={() => {
                    if (isEditingProfile) {
                      handleProfileSave();
                    } else {
                      setIsEditingProfile(true);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-[#00FFFF] border border-[#00FFFF] text-sm font-bold uppercase hover:bg-[#00FFFF] hover:text-black transition-all"
                  whileHover={{ boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}
                >
                  <Edit2 className="w-4 h-4" />
                  {isEditingProfile ? 'SAVE' : 'EDIT'}
                </motion.button>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <div className="relative group">
                  <img
                    src={avatarUrl}
                    alt={profile.username}
                    className="w-32 h-32 border-2 border-[#00FFFF]"
                    style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}
                  />
                  {isEditingProfile && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Edit2 className="w-8 h-8 text-[#00FFFF]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-xs text-[#00FFFF] mb-2 uppercase tracking-wider">User ID</label>
                    <input
                      type="text"
                      value={profile.userId}
                      disabled
                      className="w-full px-4 py-2 bg-black text-white/50 border border-white/20 mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#00FFFF] mb-2 uppercase tracking-wider">Username</label>
                    <input
                      id="edit-username"
                      type="text"
                      defaultValue={profile.username}
                      disabled={!isEditingProfile}
                      className="w-full px-4 py-2 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)] disabled:opacity-50 mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#00FFFF] mb-2 uppercase tracking-wider">Email</label>
                    <input
                      id="edit-email"
                      type="email"
                      defaultValue={profile.email}
                      disabled={!isEditingProfile}
                      className="w-full px-4 py-2 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)] disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#00FFFF] mb-2 uppercase tracking-wider">Member Since</label>
                    <input
                      type="text"
                      value={profile.joinDate}
                      disabled
                      className="w-full px-4 py-2 bg-black text-white/50 border border-white/20 mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </CyberCard>

            {/* Activity Timeline */}
            <CyberCard glow className="p-6">
              <h2 className="text-2xl font-bold text-[#00FFFF] mb-6 pb-4 border-b border-[#00FFFF]/30 uppercase tracking-wider">
                &gt; MY_ACTIVITY
              </h2>
              <div className="space-y-4">
                {activity.map((act, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 border border-[#00FFFF]/30 hover:border-[#00FFFF] hover:bg-[#00FFFF]/5 transition-all"
                  >
                    <div className="w-3 h-3 bg-[#00FFFF] flex-shrink-0 mt-2" style={{ boxShadow: '0 0 10px rgba(0, 255, 255, 0.8)' }} />
                    <div className="flex-1">
                      <p className="font-bold text-white mono text-sm">{act.action}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-white/70">
                        <span className="flex items-center gap-1 mono">
                          <Clock className="w-3 h-3 text-[#00FFFF]" />
                          {act.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#00FFFF]" />
                          {act.location}
                        </span>
                        <span className="mono text-[#00FFFF]">
                          IP: {act.ip}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CyberCard>

            {/* Change Password */}
            <CyberCard glow className="p-6">
              <h2 className="text-2xl font-bold text-[#00FFFF] mb-4 uppercase tracking-wider">&gt; SECURITY</h2>
              <p className="text-white/70 mb-6">Maintain system security by updating credentials regularly.</p>
              <motion.button
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-6 py-3 bg-black text-[#00FFFF] border border-[#00FFFF] font-bold uppercase tracking-wider hover:bg-[#00FFFF] hover:text-black transition-all"
                whileHover={{ boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }}
              >
                &gt; CHANGE_PASSWORD
              </motion.button>
            </CyberCard>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <CyberModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="&gt; CHANGE_PASSWORD"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs text-[#00FFFF] mb-2 uppercase tracking-wider">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)]"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#00FFFF] mb-2 uppercase tracking-wider">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)]"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#00FFFF] mb-2 uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)]"
              placeholder="••••••••"
              required
            />
          </div>

          {/* CSRF Token */}
          <div className="flex items-center gap-2 px-3 py-2 border border-[#00FFFF]/30 bg-[#00FFFF]/5">
            <Key className="w-4 h-4 text-[#00FFFF]" />
            <span className="text-xs text-[#00FFFF] mono">CSRF: 0xPWD_CHANGE_XYZ</span>
          </div>

          <div className="flex gap-3 pt-2">
            <motion.button
              type="submit"
              className="flex-1 py-2 px-4 bg-black text-[#00FFFF] border-2 border-[#00FFFF] font-bold uppercase hover:bg-[#00FFFF] hover:text-black transition-all"
              whileHover={{ boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }}
              whileTap={{ scale: 0.98 }}
            >
              &gt; UPDATE
            </motion.button>
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
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

export default UserDashboard;