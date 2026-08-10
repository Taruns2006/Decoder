import React, { useEffect, useState } from 'react';
import { plannerAPI } from '../services/api';
import { 
  Calendar, Clock, CheckCircle2, ChevronRight, AlertTriangle, 
  RefreshCw, Award, Plus, Sparkles, BookOpen, Flame, CalendarDays
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PlannerPage: React.FC = () => {
  const { refreshUser } = useAuth();
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalibrating, setRecalibrating] = useState(false);
  const [error, setError] = useState('');
  
  // Weekly stats
  const [completedCount, setCompletedCount] = useState(0);
  const [hoursStudied, setHoursStudied] = useState(0);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await plannerAPI.getSessions();
      setSessions(res.data);
      
      // Calculate weekly metrics
      const completed = res.data.filter((s: any) => s.status === 'completed');
      setCompletedCount(completed.length);
      setHoursStudied(completed.reduce((acc: number, cur: any) => acc + cur.duration_minutes, 0) / 60);
    } catch (err) {
      console.error(err);
      setError('Could not connect to study planner API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      await plannerAPI.generatePlanner();
      await loadSessions();
      refreshUser();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to generate planner. Ensure you have added subjects.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await plannerAPI.updateSessionStatus(id, status);
      await loadSessions();
      refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecalibrate = async () => {
    setRecalibrating(true);
    try {
      const res = await plannerAPI.recalibrate();
      await loadSessions();
      alert(res.data.message || 'Study plan recalibrated successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to recalibrate plan.');
    } finally {
      setRecalibrating(false);
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[50vh] flex-col gap-4">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading your study plan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Study Plan</h1>
          <p className="text-sm text-slate-400 mt-1">Your prioritized learning schedule across all subjects.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {sessions.length > 0 && (
            <button
              onClick={handleRecalibrate}
              disabled={recalibrating}
              className="px-4 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 rounded-lg font-bold text-xs text-brand-teal flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={14} className={recalibrating ? 'animate-spin' : ''} />
              Recalibrate Plan
            </button>
          )}

          <button
            onClick={handleGeneratePlan}
            className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <Sparkles size={14} />
            Generate Plan
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-xl max-w-xl mx-auto shadow-sm">
          <CalendarDays className="text-brand-teal mx-auto mb-4" size={40} />
          <h3 className="text-lg font-bold text-white">No study plan yet</h3>
          <p className="text-sm text-slate-400 mt-2 mb-6 leading-relaxed">
            The planner uses your syllabus, target hours, and exam dates to build a realistic, prioritized schedule. Takes a few seconds.
          </p>
          <button onClick={handleGeneratePlan} className="px-6 py-3 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg font-bold text-sm transition-colors">
            Generate Study Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Planner Side-Stats */}
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-5">
              <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                 <Award size={16} className="text-slate-500" /> Weekly Summary
              </h4>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-2xl font-black text-white">{completedCount}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">Sessions</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-brand-teal">{hoursStudied.toFixed(1)}<span className="text-lg">h</span></p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">Time Spent</p>
                </div>
              </div>

              {/* Motivation quote */}
              <div className="text-xs text-slate-400 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 leading-relaxed mt-4">
                If you miss a session, click <strong className="text-brand-teal">Recalibrate plan</strong> above — the AI will redistribute remaining topics automatically.
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="lg:col-span-3 space-y-5">
            <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
              <CalendarDays size={16} /> Scheduled Study Sessions
            </h3>
            
            <div className="space-y-3 pt-2">
              {sessions.map((s) => (
                <div 
                  key={s.id} 
                  className={`border p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    s.status === 'completed'
                      ? 'bg-green-500/5 border-green-500/25'
                      : s.status === 'skipped'
                        ? 'bg-slate-800/30 border-slate-700/50 opacity-60'
                        : s.status === 'missed'
                          ? 'bg-red-500/5 border-red-500/20 opacity-75'
                          : 'bg-slate-900 border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-5">
                    {/* Time icon / Date */}
                    <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] text-brand-teal font-extrabold uppercase">
                        {new Date(s.date).toLocaleDateString([], {weekday: 'short'})}
                      </span>
                      <span className="text-lg font-black text-white leading-tight">
                        {new Date(s.date).getDate()}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          s.type === 'learning' 
                            ? 'bg-brand-teal/10 text-brand-teal' 
                            : s.type === 'revision' 
                              ? 'bg-brand-purple/10 text-brand-purple' 
                              : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {s.type}
                        </span>
                        <h4 className="font-bold text-sm text-white leading-none">{s.topic_name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">{s.subject_name}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <Clock size={12} />
                        <span className="font-semibold">{s.start_time} - {s.end_time} ({s.duration_minutes} min)</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions based on Status */}
                  <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                    {s.status === 'scheduled' ? (
                      <>
                        <button 
                          onClick={() => handleStatusChange(s.id, 'skipped')}
                          className="px-3 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Skip
                        </button>
                        <button 
                          onClick={() => handleStatusChange(s.id, 'completed')}
                          className="px-4 py-2 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <CheckCircle2 size={14} />
                          Check Off
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-md border ${
                          s.status === 'completed' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : s.status === 'skipped'
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {s.status}
                        </span>
                        
                        {/* Option to restore if they marked skipped/missed */}
                        {s.status !== 'completed' && (
                          <button
                            onClick={() => handleStatusChange(s.id, 'scheduled')}
                            className="text-[10px] text-brand-teal hover:text-white font-bold transition-colors"
                          >
                            Reschedule
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerPage;
