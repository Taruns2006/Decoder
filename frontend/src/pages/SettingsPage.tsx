import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { resourceAPI } from '../services/api';
import { 
  Settings, User, Bookmark, Compass, Bell, 
  ExternalLink, CheckCircle, Sparkles 
} from 'lucide-react';

interface SettingsPageProps {
  tab?: 'settings' | 'resources';
}

const SettingsPage: React.FC<SettingsPageProps> = ({ tab = 'settings' }) => {
  const { user, onboard, refreshUser } = useAuth();
  
  // Settings Tab/Panel toggler (if tab is passed as prop, use it)
  const [activeTab, setActiveTab] = useState<'profile' | 'resources' | 'notifications'>(
    tab === 'resources' ? 'resources' : 'profile'
  );
  
  // Profile settings state
  const [name, setName] = useState('');
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [preferredStudyTime, setPreferredStudyTime] = useState('evening');
  const [goals, setGoals] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Resources state
  const [resources, setResources] = useState<any[]>([]);
  const [resLoading, setResLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setWeeklyHours(user.weekly_hours);
      setPreferredStudyTime(user.preferred_study_time || 'evening');
      setGoals(user.goals || '');
    }
  }, [user]);

  const loadResources = async () => {
    setResLoading(true);
    try {
      const res = await resourceAPI.getResources();
      setResources(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setResLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'resources') {
      loadResources();
    }
  }, [activeTab]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await onboard({
        name,
        weekly_hours: Number(weeklyHours),
        preferred_study_time: preferredStudyTime,
        goals
      });
      setSuccessMsg('Profile settings updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshUser();
    } catch (err) {
      console.error(err);
      alert('Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSaveResource = async (id: number) => {
    try {
      await resourceAPI.toggleSaveResource(id);
      loadResources();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {activeTab === 'resources' ? 'Educational Resource Hub' : 'System Settings'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">Configure your learning profile and manage system preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Menu Tabs sidebar */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 h-fit space-y-2 shadow-sm">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === 'profile' 
                ? 'bg-brand-teal/10 text-brand-teal' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <User size={16} /> Profile & Goals
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === 'resources' 
                ? 'bg-brand-teal/10 text-brand-teal' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Compass size={16} /> Resources Library
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-3 ${
              activeTab === 'notifications' 
                ? 'bg-brand-teal/10 text-brand-teal' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Bell size={16} /> Notifications
          </button>
        </div>

        {/* Workspace panel */}
        <div className="lg:col-span-3">
          {/* PROFILE PANEL */}
          {activeTab === 'profile' && (
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
              <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-3 mb-6 uppercase tracking-wider">Configure Student Profile</h3>
              
              {successMsg && (
                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-sm text-green-400 mb-6 flex items-center gap-2 font-medium">
                  <CheckCircle size={16} />
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-5 max-w-xl">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Student Display Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Study Week Target (Hours)</label>
                    <input type="number" required min={1} value={weeklyHours} onChange={(e) => setWeeklyHours(Number(e.target.value))} className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all" />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Preferred Work Hours Slot</label>
                    <select value={preferredStudyTime} onChange={(e) => setPreferredStudyTime(e.target.value)} className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all">
                      <option value="morning">Morning Slots</option>
                      <option value="afternoon">Afternoon Slots</option>
                      <option value="evening">Evening Slots</option>
                      <option value="night">Night Slots</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Primary Academic Intent & Career Goals</label>
                  <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={4} className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all resize-none" />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg font-bold text-sm transition-colors"
                  >
                    {saving ? 'Saving...' : 'Update Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* RESOURCES PANEL */}
          {activeTab === 'resources' && (
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
              <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-3 mb-6 uppercase tracking-wider">Curated Resource Library</h3>
              
              {resLoading ? (
                <div className="text-center py-20">
                  <div className="w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {resources.map((res) => (
                    <div key={res.id} className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <span className="text-[10px] text-brand-teal font-bold uppercase tracking-wider bg-brand-teal/10 px-2.5 py-1 rounded-md border border-brand-teal/20">
                          {res.category}
                        </span>
                        <h4 className="font-bold text-sm text-white leading-tight mt-2">{res.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{res.description}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-700/50 flex justify-between items-center text-xs">
                        <a 
                          href={res.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-brand-cyan hover:text-white hover:underline flex items-center gap-1.5 font-bold transition-colors"
                        >
                          OPEN LINK <ExternalLink size={12} />
                        </a>
                        <button
                          onClick={() => handleToggleSaveResource(res.id)}
                          className={`font-bold transition-colors flex items-center gap-1 ${res.saved ? 'text-brand-teal hover:text-slate-400' : 'text-slate-400 hover:text-brand-teal'}`}
                        >
                          {res.saved ? '★ Bookmarked' : '☆ Bookmark'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS PANEL */}
          {activeTab === 'notifications' && (
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-5 shadow-sm">
              <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-3 uppercase tracking-wider">System Alerts</h3>
              <p className="text-sm text-slate-400">Settings and triggers for calendar notifications, deadline alerts, and mock quizzes reminders.</p>
              
              <div className="space-y-4 pt-2">
                {[
                  { label: 'Upcoming assignment deadline reminders', desc: 'Alerts you 24 hours prior to estimated work thresholds.' },
                  { label: 'Weekly learning performance analytics', desc: 'Compiles and feeds readiness scores directly to your inbox.' },
                  { label: 'Tide-Chart recalibration alerts', desc: 'Sends status checks when study slots are bypassed or missed.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                    <input type="checkbox" defaultChecked className="mt-1 accent-brand-teal w-4 h-4" />
                    <div>
                      <h4 className="font-bold text-sm text-white leading-none">{item.label}</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-normal">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
