/**
 * LoginPage – User authentication screen.
 *
 * Allows users to log in with their username or email and password.
 * Uses the fetchWithCsrf helper to include CSRF protection.
 * After successful login, redirects to either the admin or user dashboard based on the user's role.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { CyberCard } from '../components/CyberCard';
import { GridBackground } from '../components/GridBackground';
import { Lock, Eye, EyeOff, Key } from 'lucide-react';
import { fetchWithCsrf } from '../../utils/csrf';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');           // Email or username input
  const [password, setPassword] = useState('');      // Password input
  const [rememberMe, setRememberMe] = useState(false); // "Remember me" checkbox
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility

  /**
   * Handles form submission.
   * Sends login credentials to the backend API.
   * On success, redirects based on the user's admin status.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Send login request with CSRF protection
    const response = await fetchWithCsrf('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: email,      // The backend accepts either username or email
        password,
        remember: rememberMe
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Redirect based on role (admin gets extra privileges)
      if (data.is_admin) {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } else {
      // Show error message (generic to avoid user enumeration)
      alert(data.error || 'Login failed');
    }
  };

  return (
    <GridBackground>
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Decorative corner elements */}
        <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-[#00FFFF]" />
        <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-[#00FFFF]" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-[#00FFFF]" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-[#00FFFF]" />

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <CyberCard glow className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-[#00FFFF] mb-4" style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
                <Lock className="w-8 h-8 text-[#00FFFF]" />
              </div>
              <h1 className="text-3xl font-bold text-[#00FFFF] mb-2">ACCESS CONTROL</h1>
              <div className="h-px bg-gradient-to-r from-transparent via-[#00FFFF] to-transparent" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm text-white mb-2 uppercase tracking-wider">
                  EMAIL ADDRESS
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)] transition-all"
                  placeholder="user@system.net"
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm text-white mb-2 uppercase tracking-wider">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-black text-white border border-white/30 focus:border-[#00FFFF] focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,255,0.5)] transition-all"
                    placeholder="••••••••"
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

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 bg-black border border-[#00FFFF] checked:bg-[#00FFFF] focus:ring-[#00FFFF] focus:ring-2"
                  style={{
                    accentColor: '#00FFFF'
                  }}
                />
                <label htmlFor="remember" className="ml-2 text-sm text-white uppercase tracking-wider">
                  Remember me
                </label>
              </div>

              {/* CSRF Token Indicator */}
              <div className="flex items-center gap-2 px-3 py-2 border border-[#00FFFF]/30 bg-[#00FFFF]/5">
                <Key className="w-4 h-4 text-[#00FFFF]" />
                <span className="text-xs text-[#00FFFF] mono">CSRF: 0xABC123XYZ789</span>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                className="w-full py-3 px-4 bg-black text-[#00FFFF] border-2 border-[#00FFFF] font-bold uppercase tracking-wider hover:bg-[#00FFFF] hover:text-black transition-all"
                whileHover={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.6)' }}
                whileTap={{ scale: 0.98 }}
              >
                &gt; LOGIN
              </motion.button>
            </form>

            {/* Sign Up Link */}
            <p className="text-center mt-6 text-sm text-white">
              New user?{' '}
              <a href="/register" className="text-[#00FFFF] hover:underline font-bold uppercase">
                Sign up
              </a>
            </p>

            {/* Security Note */}
            <div className="mt-8 pt-6 border-t border-[#00FFFF]/30">
              <div className="flex items-center justify-center gap-2 text-xs text-[#00FFFF]">
                <Lock className="w-4 h-4" />
                <span className="uppercase tracking-wider">All forms protected by CSRF tokens</span>
              </div>
            </div>
          </CyberCard>

          {/* Demo hint */}
          <div className="mt-4 border border-[#00FFFF]/50 bg-black/90 p-3 text-xs text-white mono">
            <p className="text-[#00FFFF] font-bold mb-1">&gt; DEMO_CREDENTIALS:</p>
            <p>• User: any email without "admin"</p>
            <p>• Admin: email with "admin"</p>
          </div>
        </motion.div>
      </div>
    </GridBackground>
  );
};

export default LoginPage;
