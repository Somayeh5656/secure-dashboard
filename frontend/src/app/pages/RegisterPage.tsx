/**
 * RegisterPage – User registration screen.
 *
 * Allows new users to create an account by providing a username, email, and password.
 * Performs basic client‑side validation (password confirmation).
 * Uses the fetchWithCsrf helper for CSRF protection.
 * On success, redirects to the login page.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { CyberCard } from '../components/CyberCard';
import { GridBackground } from '../components/GridBackground';
import { Lock, Eye, EyeOff, Key } from 'lucide-react';
import { fetchWithCsrf } from '../../utils/csrf';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handles form submission.
   * Validates that password and confirmation match, then sends registration data to the backend.
   * On success, redirects to login page with a success message.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client‑side validation
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetchWithCsrf('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        alert('Registration successful. Please log in.');
        navigate('/'); // Redirect to login page
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <GridBackground>
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* decorative corners */}
        <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-[#00FFFF]" />
        <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-[#00FFFF]" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-[#00FFFF]" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-[#00FFFF]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <CyberCard glow className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-[#00FFFF] mb-4" style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                <Lock className="w-8 h-8 text-[#00FFFF]" />
              </div>
              <h1 className="text-3xl font-bold text-[#00FFFF] mb-2">REGISTER</h1>
              <div className="h-px bg-gradient-to-r from-transparent via-[#00FFFF] to-transparent" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-white mb-2 uppercase tracking-wider">USERNAME</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white mb-2 uppercase tracking-wider">EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white mb-2 uppercase tracking-wider">PASSWORD</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-[#00FFFF] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-white mb-2 uppercase tracking-wider">CONFIRM PASSWORD</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)] transition-all"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex items-center gap-2 px-3 py-2 border border-[#00FFFF]/30 bg-[#00FFFF]/5">
                <Key className="w-4 h-4 text-[#00FFFF]" />
                <span className="text-xs text-[#00FFFF] mono">CSRF: protected</span>
              </div>

              <motion.button
                type="submit"
                className="w-full py-3 px-4 bg-black text-[#00FFFF] border-2 border-[#00FFFF] font-bold uppercase tracking-wider hover:bg-[#00FFFF] hover:text-black transition-all"
                whileHover={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.6)' }}
                whileTap={{ scale: 0.98 }}
              >
                &gt; REGISTER
              </motion.button>
            </form>

            <p className="text-center mt-6 text-sm text-white">
              Already have an account?{' '}
              <a href="/" className="text-[#00FFFF] hover:underline font-bold uppercase">
                Log in
              </a>
            </p>

            <div className="mt-8 pt-6 border-t border-[#00FFFF]/30">
              <div className="flex items-center justify-center gap-2 text-xs text-[#00FFFF]">
                <Lock className="w-4 h-4" />
                <span className="uppercase tracking-wider">All forms protected by CSRF tokens</span>
              </div>
            </div>
          </CyberCard>
        </motion.div>
      </div>
    </GridBackground>
  );
};

export default RegisterPage;