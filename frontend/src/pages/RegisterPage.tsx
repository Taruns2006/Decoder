import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, ShieldAlert } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setSubmitting(true);
    try {
      await register({ email, password });
      navigate('/onboarding');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Registration failed. A user with this email may already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-deep flex items-center justify-center p-6 relative overflow-hidden text-white">
      {/* Background glow effects */}
      <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-teal/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-brand-glass-border shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-teal to-brand-purple flex items-center justify-center font-black text-white text-xl mx-auto shadow-lg shadow-brand-teal/20 mb-3 animate-pulse">A</div>
          <h2 className="text-2xl font-bold tracking-wider">INITIATE REGISTRATION</h2>
          <p className="text-xs text-brand-teal font-medium tracking-widest mt-1">START YOUR ACADEMIC ODYSSEY</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3.5 mb-6 flex items-start gap-2.5 text-xs text-red-400">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wider">EMAIL ADDRESS</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail size={16} />
              </span>
              <input 
                type="email" 
                required
                placeholder="student@atlantis.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 bg-black/40 border border-brand-glass-border rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wider">PASSWORD</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={16} />
              </span>
              <input 
                type="password" 
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 bg-black/40 border border-brand-glass-border rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wider">CONFIRM PASSWORD</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={16} />
              </span>
              <input 
                type="password" 
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 bg-black/40 border border-brand-glass-border rounded-xl text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 mt-4 bg-gradient-to-r from-brand-teal to-brand-cyan text-brand-deep font-extrabold text-sm rounded-xl hover:shadow-lg hover:shadow-brand-teal/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? 'GENERATING COGNITIVE LOGS...' : 'REGISTER NEW STUDENT PROFILE'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          <span>Already have an academic account? </span>
          <Link to="/login" className="text-brand-teal hover:underline font-semibold">Gateway Login</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
